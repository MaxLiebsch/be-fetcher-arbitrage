import {
  AddProductInfoProps,
  DbProductRecord,
  globalEventEmitter,
  NotFoundCause,
  ObjectId,
  ProductRecord,
  QueryQueue,
  querySellerInfosQueue,
  Shop,
  uuid,
  yieldQueues,
} from "@dipmaxtech/clr-pkg";
import { DEFAULT_CHECK_PROGRESS_INTERVAL, proxyAuth } from "../../constants";

import { updateTask } from "../../db/util/tasks";
import {
  handleLookupInfoNotFound,
  handleLookupInfoProductInfo,
} from "../../util/lookupInfoHelper";
import { getEanFromProduct } from "../../util/getEanFromProduct";
import { salesDbName } from "../../db/mongo";
import { DailySalesTask } from "../../types/tasks/DailySalesTask";
import { getMaxLoadQueue } from "../../util/getMaxLoadQueue";
import { LookupInfoStats } from "../../types/taskStats/LookupInfoStats";
import { DailySalesReturnType } from "../../types/DailySalesReturnType";
import { combineQueueStats } from "../../util/combineQueueStats";

export const lookupInfo = async (
  sellerCentral: Shop,
  origin: Shop,
  task: DailySalesTask
): Promise<DailySalesReturnType> =>
  new Promise(async (res, rej) => {
    const { browserConfig, _id: taskId, shopDomain } = task;
    const { concurrency, productLimit, browserConcurrency } =
      browserConfig.lookupInfo;

    let infos: LookupInfoStats = {
      total: 1,
      notFound: 0,
      locked: 0,
      shops: {
        [shopDomain]: 0,
      },
      missingProperties: {
        price: 0,
        costs: 0,
        infos: 0,
      },
      elapsedTime: "",
    };

    const eventEmitter = globalEventEmitter;
    const queryQueues: QueryQueue[] = [];
    const queuesWithId: { [key: string]: QueryQueue } = {};
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
                  await updateTask(taskId, {
                    $set: { progress: task.progress },
                  });
                  const queueStats = combineQueueStats(
                    queryQueues.map((q) => q.queueStats)
                  );
                  res({ infos, queueStats });
                }
              }
            }
          );
          return queue.connect();
        }
      )
    );

    async function isProcessComplete(queue: QueryQueue) {
      if (infos.total === productLimit) {
        interval && clearInterval(interval);
        await updateTask(taskId, { $set: { progress: task.progress } });
        await Promise.all(queryQueues.map((queue) => queue.disconnect(true)));
        res({ infos, queueStats: queue.queueStats });
      }
    }

    const queueIterator = yieldQueues(queryQueues);

    const completedProducts: ObjectId[] = [];
    let interval = setInterval(async () => {
      await updateTask(taskId, {
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
      const { lnk: productLink, asin, _id: productId, s_hash } = product;
      const ean = getEanFromProduct(product);

      const addProduct = async (product: ProductRecord) => {};
      const addProductInfo = async ({
        productInfo,
        url,
      }: AddProductInfoProps) => {
        completedProducts.push(productId);
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
      const handleNotFound = async (cause: NotFoundCause) => {
        completedProducts.push(productId);
        await handleLookupInfoNotFound(salesDbName, productId);
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
