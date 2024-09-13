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
import { handleResult } from "../handleResult";
import { MissingProductsError, MissingShopError } from "../errors";
import { CONCURRENCY, proxyAuth } from "../constants";
import { checkProgress } from "../util/checkProgress";
import { lookForUnmatchedEans } from "../db/util/lookupInfo/lookForUnmatchedEans";
import { getShop } from "../db/util/shops";
import { updateProgressInLookupInfoTask } from "../util/updateProgressInTasks";
import {
  handleLookupInfoNotFound,
  handleLookupInfoProductInfo,
} from "../util/lookupInfoHelper";
import { getProductLimit } from "../util/getProductLimit";
import { getEanFromProduct } from "../util/getEanFromProduct";
import { TaskCompletedStatus } from "../status";
import { LookupInfoStats } from "../types/taskStats/LookupInfoStats";
import { getMaxLoadQueue } from "../util/getMaxLoadQueue";
import { LookupInfoTask } from "../types/tasks/Tasks";
import { TaskReturnType } from "../types/TaskReturnType";

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

    const { products, shops } = await lookForUnmatchedEans(
      taskId,
      action || "none",
      productLimit
    );

    shops.forEach(async (info) => {
      infos.shops[info.shop.d] = 0;
    });

    if (!products.length)
      return reject(new MissingProductsError(`No products ${type}`, task));

    const _productLimit = getProductLimit(products.length, productLimit);
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

    const isCompleted = async () => {
      const check = await checkProgress({
        task,
        queue: queryQueues,
        infos,
        startTime,
        productLimit: _productLimit,
      });
      if (check instanceof TaskCompletedStatus) {
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
              console.log("Emitter: Queue completed ", queueId);
              const maxQueue = getMaxLoadQueue(queryQueues);
              const tasks = maxQueue.pullTasksFromQueue();
              if (tasks) {
                console.log(
                  "adding",
                  tasks.length,
                  " tasks from ",
                  maxQueue.queueId,
                  "to ",
                  queueId
                );
                queuesWithId[queueId].addTasksToQueue(tasks);
              } else {
                console.log("no more tasks to distribute. Closing ", queueId);
                await queuesWithId[queueId].disconnect(true);
                const isDone = queryQueues.every((q) => q.workload() === 0);
                if (isDone) {
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
