import {
  globalEventEmitter,
  QueryQueue,
  querySellerInfosQueue,
  uuid,
  yieldQueues,
} from "@dipmaxtech/clr-pkg";
import { DEFAULT_CHECK_PROGRESS_INTERVAL, proxyAuth } from "../../constants.js";

import { updateTask } from "../../db/util/tasks.js";
import {
  handleLookupInfoNotFound,
  handleLookupInfoProductInfo,
} from "../../util/lookupInfoHelper.js";
import { getEanFromProduct } from "../../util/getEanFromProduct.js";
import { salesDbName } from "../../db/mongo.js";

export const getMaxLoadQueue = (queues) => {
  const queueLoad = queues.map((queue) => queue.workload());
  const maxQueueLoad = Math.max(...queueLoad);
  const index = queueLoad.indexOf(maxQueueLoad);
  return queues[index];
};

export const lookupInfo = async (sellerCentral, origin, task) =>
  new Promise(async (res, rej) => {
    const { browserConfig, _id, shopDomain } = task;
    const { concurrency, productLimit, browserConcurrency } =
      browserConfig.lookupInfo;

    let infos = {
      total: 1,
      old: 0,
      new: 0,
      failedSave: 0,
      notFound: 0,
      locked: 0,
      shops: {
        [shopDomain]: 0,
      },
      missingProperties: {
        infos: 0,
        costs: 0,
      },
    };

    const eventEmitter = globalEventEmitter;
    const queryQueues = [];
    const queuesWithId = {};
    task.actualProductLimit = task.lookupInfo.length;
    await Promise.all(
      Array.from({ length: browserConcurrency || 1 }, (v, k) => k + 1).map(
        async () => {
          const queue = new QueryQueue(concurrency, proxyAuth, task);
          queuesWithId[queue.queueId] = queue;
          queryQueues.push(queue);
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
                  interval && clearInterval(interval);
                  await updateTask(_id, { $set: { progress: task.progress } });
                  res(infos);
                }
              }
            }
          );
          return queue.connect();
        }
      )
    );

    async function isProcessComplete(queue) {
      if (infos.total === productLimit) {
        interval && clearInterval(interval);
        await updateTask(_id, { $set: { progress: task.progress } });
        await Promise.all(queryQueues.map((queue) => queue.disconnect(true)));
        res(infos);
      }
    }

    const queueIterator = yieldQueues(queryQueues);

    const completedProducts = [];
    let interval = setInterval(async () => {
      await updateTask(_id, {
        $pull: {
          "progress.lookupInfo": { _id: { $in: completedProducts } },
        },
      });
    }, DEFAULT_CHECK_PROGRESS_INTERVAL);

    while (task.progress.lookupInfo.length) {
      const product = task.lookupInfo.pop();
      task.progress.lookupInfo.pop();
      if (!product) continue;
      const queue = queueIterator.next().value;
      const hasEan = Boolean(origin.hasEan || origin?.ean);
      const { lnk: productLink, asin, _id, s_hash} = product;
      const ean = getEanFromProduct(product);

      const addProduct = async (product) => {};
      const addProductInfo = async ({ productInfo, url }) => {
        completedProducts.push(_id);
        infos.total++;
        queue.total++;
        await handleLookupInfoProductInfo(
          salesDbName,
          hasEan,
          { productInfo, url },
          product,
          infos
        );
        await isProcessComplete(queue);
      };
      const handleNotFound = async (cause) => {
        completedProducts.push(product._id);
        await handleLookupInfoNotFound(salesDbName, productLink);
        infos.notFound++;
        infos.total++;
        queue.total++;
        await isProcessComplete(queue);
      };
      queue.pushTask(querySellerInfosQueue, {
        retries: 0,
        shop: sellerCentral,
        requestId: uuid(),
        s_hash,
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
        query: {
          product: {
            value: hasEan ? asin || ean : asin,
            key: hasEan ? asin || ean : asin,
          },
        },
        prio: 0,
        extendedLookUp: false,
        pageInfo: {
          link: sellerCentral.entryPoints[0].url,
          name: sellerCentral.d,
        },
      });
    }
  });
