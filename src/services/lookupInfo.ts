import {
  AddProductInfoProps,
  NotFoundCause,
  ProductRecord,
  QueryQueue,
  globalEventEmitter,
  querySellerInfosQueue,
  uuid,
  yieldQueues,
} from "@dipmaxtech/clr-pkg";
import _ from "underscore";
import { handleResult } from "../handleResult.js";
import { CONCURRENCY, proxyAuth } from "../constants.js";
import { checkProgress } from "../util/checkProgress.js";
import { getShop } from "../db/util/shops.js";
import { updateProgressInLookupInfoTask } from "../util/updateProgressInTasks.js";
import {
  handleLookupInfoNotFound,
  handleLookupInfoProductInfo,
} from "../util/lookupInfoHelper.js";
import { getProductLimitMulti } from "../util/getProductLimit.js";
import { getEanFromProduct } from "../util/getEanFromProduct.js";
import { TaskCompletedStatus } from "../status.js";
import { LookupInfoStats } from "../types/taskStats/LookupInfoStats.js";
import { getMaxLoadQueue } from "../util/getMaxLoadQueue.js";
import { LookupInfoTask } from "../types/tasks/Tasks.js";
import { TaskReturnType } from "../types/TaskReturnType.js";
import { countRemainingProducts } from "../util/countRemainingProducts.js";
import { setTaskId } from "../db/util/queries.js";
import { MissingProductsError } from "../errors.js";
import { MissingShopError } from "../errors.js";
import { log } from "../util/logger.js";
import { findPendingProductsForTask } from "../db/util/multiShopUtilities/findPendingProductsForTask.js";

export default async function lookupInfo(task: LookupInfoTask): TaskReturnType {
  return new Promise(async (resolve, reject) => {
    const {
      productLimit,
      _id: taskId,
      action,
      type,
      browserConcurrency,
      concurrency,
    } = task;

    let infos: LookupInfoStats = {
      total: 0,
      notFound: 0,
      locked: 0,
      shops: {},
      elapsedTime: "",
      missingProperties: {
        price: 0,
        costs: 0,
        infos: 0,
      },
    };

    const { products, shops } = await findPendingProductsForTask(
      "LOOKUP_INFO",
      taskId,
      action || "none",
      productLimit
    );
    log(`Found ${products.length} products`);

    shops.forEach(async (info) => {
      infos.shops[info.shop.d] = 0;
    });

    if (!products.length)
      return reject(new MissingProductsError(`No products ${type}`, task));

    const _productLimit = getProductLimitMulti(products.length, productLimit);
    log(`Product limit: ${_productLimit}`);
    task.actualProductLimit = _productLimit;

    const toolInfo = await getShop("sellercentral.amazon.de");

    if (!toolInfo) {
      return reject(
        new MissingShopError(`No shop found for sellercentral.amazon.de`, task)
      );
    }

    infos.locked = products.length;

    //Update task progress
    await updateProgressInLookupInfoTask();

    const startTime = Date.now();

    const queryQueues: QueryQueue[] = [];
    const queuesWithId: { [key: string]: QueryQueue } = {};
    const eventEmitter = globalEventEmitter;

    let done = false;

    const isCompleted = async () => {
      const check = await checkProgress({
        task,
        queue: queryQueues,
        infos,
        startTime,
        productLimit: _productLimit,
      });
      if (check instanceof TaskCompletedStatus) {
        const remaining = await countRemainingProducts(shops, taskId, type);
        log(`Completed: Rest: ${remaining}, taskId ${setTaskId(taskId)}`);
        await updateProgressInLookupInfoTask();
        handleResult(check, resolve, reject);
      }
    };

    await Promise.all(
      Array.from({ length: browserConcurrency || 1 }, (v, k) => k + 1).map(
        async () => {
          const queue = new QueryQueue(
            concurrency ? concurrency : CONCURRENCY,
            proxyAuth,
            task
          );
          queuesWithId[queue.queueId] = queue;
          //@ts-ignore
          eventEmitter.on(
            `${queue.queueId}-finished`,
            async function lookupInfoCallback({ queueId }) {
              const maxQueue = getMaxLoadQueue(queryQueues);
              const tasks = maxQueue.pullTasksFromQueue();
              if (tasks) {
                log(
                  `Adding ${tasks.length} tasks from ${maxQueue.queueId} to ${queueId}`
                );
                queuesWithId[queueId].addTasksToQueue(tasks);
              } else {
                log("No more tasks to distribute. Closing " + queueId);
                await queuesWithId[queueId].disconnect(true);
                const isDone = queryQueues.every((q) => q.workload() === 0);
                if (isDone) {
                  const remaining = await countRemainingProducts(
                    shops,
                    taskId,
                    type
                  );
                  log(
                    `Eventemitter: Remaining products: ${remaining}, taskId ${setTaskId(
                      taskId
                    )}`
                  );
                  log("All queues are done");
                  await isCompleted();
                }
              }
            }
          );
          queryQueues.push(queue);
          return queue.connect();
        }
      )
    );

    const queueIterator = yieldQueues(queryQueues);

    for (let index = 0; index < products.length; index++) {
      const queue = queueIterator.next().value;
      const { product, shop } = products[index];
      const shopDomain = shop.d;
      const hasEan = Boolean(shop.hasEan || shop?.ean);
      const { asin, _id: productId, s_hash } = product;
      const ean = getEanFromProduct(product);
      const addProduct = async (product: ProductRecord) => {};
      const addProductInfo = async ({
        productInfo,
        url,
      }: AddProductInfoProps) => {
        await handleLookupInfoProductInfo(
          shopDomain,
          hasEan,
          { productInfo, url },
          product,
          infos
        );
        infos.shops[shopDomain]++;
        infos.total++;
        queue.total++;
        await isCompleted();
      };
      const handleNotFound = async (cause: NotFoundCause) => {
        infos.notFound++;
        await handleLookupInfoNotFound(shopDomain, productId);
        infos.shops[shopDomain]++;
        infos.total++;
        queue.total++;
        await isCompleted();
      };

      const query = {
        product: {
          value: hasEan ? asin || ean : asin,
          key: hasEan ? asin || ean : asin,
        },
      };
      queue.pushTask(querySellerInfosQueue, {
        retries: 0,
        shop: toolInfo,
        s_hash,
        requestId: uuid(),
        targetShop: {
          prefix: "",
          d: shopDomain,
          name: shopDomain,
        },
        addProduct,
        lookupRetryLimit: 0,
        onNotFound: handleNotFound,
        addProductInfo,
        queue,
        query,
        prio: 0,
        extendedLookUp: false,
        pageInfo: {
          link: toolInfo.entryPoints[0].url,
          name: toolInfo.d,
        },
      });
    }
  });
}
