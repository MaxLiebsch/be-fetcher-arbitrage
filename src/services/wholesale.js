import {
  QueryQueue,
  generateUpdate,
  querySellerInfosQueue,
  yieldQueues,
  globalEventEmitter,
} from "@dipmaxtech/clr-pkg";
import _ from "underscore";
import { handleResult } from "../handleResult.js";
import { MissingProductsError } from "../errors.js";
import { getShop } from "./db/util/shops.js";
import {
  CONCURRENCY,
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  proxyAuth,
} from "../constants.js";
import { checkProgress } from "../util/checkProgress.js";
import {
  lockWholeSaleProducts,
  updateWholeSaleProduct,
} from "./db/util/wholesaleSearch/crudWholeSaleSearch.js";
import { updateWholesaleProgress } from "../util/updateProgressInTasks.js";
import { upsertAsin } from "./db/util/asinTable.js";
import { getMaxLoadQueue } from "../util/productPriceComperator/lookupInfo.js";

export default async function wholesale(task) {
  return new Promise(async (resolve, reject) => {
    const {
      shopDomain,
      productLimit,
      _id: taskId,
      action,
      userId,
      browserConcurrency,
    } = task;

    const wholeSaleProducts = await lockWholeSaleProducts(
      productLimit,
      taskId,
      action
    );

    let infos = {
      new: 0,
      total: 1,
      old: 1,
      failedSave: 0,
      locked: 0,
      missingProperties: {
        name: 0,
        price: 0,
        link: 0,
        image: 0,
      },
    };

    if (!wholeSaleProducts.length)
      return reject(
        new MissingProductsError(`No products for ${shopDomain}`, task)
      );

    const _productLimit =
      wholeSaleProducts.length < productLimit
        ? wholeSaleProducts.length
        : productLimit;
    task.actualProductLimit = _productLimit;

    infos.locked = wholeSaleProducts.length;

    //Update task progress
    await updateWholesaleProgress(taskId);

    const startTime = Date.now();

    const toolInfo = await getShop("sellercentral.amazon.de");

    const queues = [];
    const queuesWithId = {};
    const eventEmitter = globalEventEmitter;

    await Promise.all(
      Array.from({ length: browserConcurrency ?? 1 }, (v, k) => k + 1).map(
        async () => {
          const queue = new QueryQueue(
            task?.concurrency ? task.concurrency : CONCURRENCY,
            proxyAuth,
            task
          );
          queue.total = 1;
          queuesWithId[queue.queueId] = queue;
          queues.push(queue);
          //@ts-ignore
          eventEmitter.on(
            `${queue.queueId}-finished`,
            async function wholesaleCallback({ queueId }) {
              console.log("Emitter: Queue completed ", queueId);
              const maxQueue = getMaxLoadQueue(queues);
              const tasks = maxQueue.pullTasksFromQueue();
              if (tasks) {
                console.log(
                  "Adding ",
                  tasks.length,
                  " tasks from: ",
                  maxQueue.queueId,
                  " to queue: ",
                  queueId
                );
                queuesWithId[queueId].addTasksToQueue(tasks);
              } else {
                console.log(
                  "Closing ",
                  queueId,
                  ". No more tasks to distribute."
                );
                await queuesWithId[queueId].disconnect(true);
              }
            }
          );
          return queue.connect();
        }
      )
    );

    const queueIterator = yieldQueues(queues);

    //TODO: Remove this interval
    const testInterval = setInterval(() => {
      const workloads = queues.reduce((acc, queue) => {
        acc[queue.queueId] = queue.workload();
        return acc;
      }, {});
      console.log(workloads);
    }, 1 * 60 * 1000);

    const interval = setInterval(async () => {
      const isDone = queues.every((q) => q.workload() === 0);
      await updateWholesaleProgress(taskId);
      if (isDone) {
        await checkProgress({
          queue: queues,
          infos,
          startTime,
          productLimit,
        }).catch(async (r) => {
          clearInterval(interval);
          await updateWholesaleProgress(taskId);
          handleResult(r, resolve, reject);
        });
      }
    }, DEFAULT_CHECK_PROGRESS_INTERVAL);

    for (let index = 0; index < wholeSaleProducts.length; index++) {
      const queue = queueIterator.next().value;
      const wholesaleProduct = wholeSaleProducts[index];
      const {
        ean,
        _id: productId,
        prc,
        a_qty: sellQty,
        qty: buyQty,
      } = wholesaleProduct;

      //not needed, I swear I will write clean code
      const addProduct = async (product) => {};
      const addProductInfo = async ({ productInfo, url }) => {
        infos.total++;
        queue.total++;
        if (productInfo) {
          const processedProductUpdate = generateUpdate(
            productInfo,
            prc,
            buyQty || 1,
            sellQty || 1
          );

          let reducedCosts = { ...processedProductUpdate.costs };
          delete reducedCosts.azn;
          await upsertAsin(processedProductUpdate.asin, [ean], reducedCosts);
          const result = await updateWholeSaleProduct(productId, {
            ...processedProductUpdate,
            status: "complete",
            lookup_pending: false,
            locked: false,
            clrName: "",
          });
          if (result.acknowledged) {
            if (result.upsertedId) infos.new++;
            else infos.old++;
          } else {
            infos.failedSave++;
          }
        } else {
          const result = await updateWholeSaleProduct(productId, {
            status: "not found",
            lookup_pending: false,
            locked: false,
            clrName: "",
          });
          if (result.acknowledged) {
            if (result.upsertedId) infos.new++;
            else infos.old++;
          } else {
            infos.failedSave++;
          }
        }
        if (infos.total === _productLimit) {
          await checkProgress({
            queue: queues,
            infos,
            startTime,
            productLimit: _productLimit,
          }).catch(async (r) => {
            await updateWholesaleProgress(taskId);
            handleResult(r, resolve, reject);
          });
        }
      };

      const handleNotFound = async () => {
        infos.notFound++;
        infos.total++;
        queue.total++;
        const result = await updateWholeSaleProduct(productId, {
          status: "not found",
          lookup_pending: false,
          locked: false,
          clrName: "",
        });
        if (result.acknowledged) {
          if (result.upsertedId) infos.new++;
          else infos.old++;
        } else {
          infos.failedSave++;
        }
        if (infos.total === _productLimit) {
          await checkProgress({
            queue: queues,
            infos,
            startTime,
            productLimit: _productLimit,
          }).catch(async (r) => {
            await updateWholesaleProgress(taskId);
            handleResult(r, resolve, reject);
          });
        }
      };

      queue.pushTask(querySellerInfosQueue, {
        retries: 0,
        shop: toolInfo,
        addProduct,
        targetShop: {
          prefix: "",
          d: `UserId: ${userId}`,
          name: `UserId: ${userId}`,
        },
        onNotFound: handleNotFound,
        addProductInfo,
        queue,
        query: {
          product: {
            value: ean,
            key: ean,
          },
        },
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
