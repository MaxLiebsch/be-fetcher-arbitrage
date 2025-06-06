import {
  AddProductInfoProps,
  globalEventEmitter,
  NotFoundCause,
  ObjectId,
  ProductRecord,
  QueryQueue,
  querySellerInfosQueue,
  Shop,
  uuid,
  yieldQueues,
} from '@dipmaxtech/clr-pkg';
import {
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  defaultQuery,
  proxyAuth,
} from '../../constants.js';
import { updateTask } from '../../db/util/tasks.js';
import {
  handleLookupInfoNotFound,
  handleLookupInfoProductInfo,
} from '../../util/lookupInfoHelper.js';
import { getEanFromProduct } from '../../util/getEanFromProduct.js';
import { salesDbName } from '../../db/mongo.js';
import { DailySalesTask } from '../../types/tasks/DailySalesTask.js';
import { getMaxLoadQueue } from '../../util/getMaxLoadQueue.js';
import { LookupInfoStats } from '../../types/taskStats/LookupInfoStats.js';
import { MultiStageReturnType } from '../../types/DailySalesReturnType.js';
import { combineQueueStats } from '../../util/combineQueueStats.js';
import { log } from '../../util/logger.js';
import { findExistingProdutAsins } from '../../util/checkForExistingProducts.js';
import { updateProductWithQuery } from '../../db/util/crudProducts.js';
import { eansReduce } from '../../util/eansReduce.js';
import { setupAllowedDomainsBasedOnShops } from '../../util/setupAllowedDomains.js';

export const lookupInfo = async (
  sellerCentral: Shop,
  origin: Shop,
  task: DailySalesTask
): Promise<MultiStageReturnType> =>
  new Promise(async (res, rej) => {
    const { browserConfig, _id: taskId, shopDomain } = task;
    task.currentStep = 'LOOKUP_INFO';
    const { concurrency, productLimit, browserConcurrency } =
      browserConfig.lookupInfo;

    let infos: LookupInfoStats = {
      total: 0,
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
      elapsedTime: '',
    };

    const eventEmitter = globalEventEmitter;
    const queryQueues: QueryQueue[] = [];
    const queuesWithId: { [key: string]: QueryQueue } = {};
    await Promise.all(
      Array.from({ length: browserConcurrency || 1 }, (v, k) => k + 1).map(
        async () => {
          const queue = new QueryQueue(concurrency, proxyAuth, task);
          queuesWithId[queue.queueId] = queue;
          queryQueues.push(queue);
          eventEmitter.on(
            `${queue.queueId}-finished`,
            async function lookupInfoCallback({ queueId }) {
              console.log('Emitter: Queue completed ', queueId);
              const maxQueue = getMaxLoadQueue(queryQueues);
              const tasks = maxQueue.pullTasksFromQueue();
              if (tasks) {
                maxQueue.actualProductLimit -= tasks.length; // decrement the actualProductLimit
                log(
                  `Adding ${tasks.length} tasks from ${maxQueue.queueId} to ${queueId}`
                );
                queuesWithId[queueId].actualProductLimit += tasks.length;
                queuesWithId[queueId].addTasksToQueue(tasks);
              } else if (queuesWithId[queueId].workload() === 0) {
                console.log('no more tasks to distribute. Closing ', queueId);
                await queuesWithId[queueId].disconnect(true);
                const isDone = queryQueues.every((q) => q.workload() === 0);
                if (isDone) {
                  log('LookupInfo: All queues are done');
                  interval && clearInterval(interval);
                  await updateTask(taskId, {
                    $set: { progress: task.progress },
                  });
                  const queueStats = combineQueueStats(
                    queryQueues.map((q) => q.queueStats)
                  );
                  res({ infos, queueStats });
                }
              } else {
                log(
                  `${queuesWithId[queueId].workload()} tasks left in ${queueId}`
                );
              }
            }
          );
          return queue.connect();
        }
      )
    );
    await setupAllowedDomainsBasedOnShops([sellerCentral], task.type)
    
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
          'progress.lookupInfo': { _id: { $in: completedProducts } },
        },
      });
    }, DEFAULT_CHECK_PROGRESS_INTERVAL);

    const eans = eansReduce(task.lookupInfo);
    const existingAsins = await findExistingProdutAsins(eans);

    while (task.progress.lookupInfo.length) {
      const product = task.lookupInfo.pop();
      task.progress.lookupInfo.pop();
      if (!product) continue;
      const queue = queueIterator.next().value as QueryQueue;
      queue.actualProductLimit++;
      const hasEan = Boolean(origin.hasEan || origin?.ean);
      let { asin, _id: productId, s_hash } = product;
      const ean = getEanFromProduct(product);
      if (!asin) {
        const asinEntry = existingAsins.find((entry) =>
          entry.eans.includes(ean)
        );

        if (asinEntry) {
          asin = asinEntry.asin;
          await updateProductWithQuery(productId, {
            $set: { asin: product.asin },
          });
        }
      }

      if (!ean) {
        completedProducts.push(productId);
        infos.total++;
        queue.total++;
        log(`EAN not found for product ${productId}`);
        continue;
      }

      const addProduct = async (product: ProductRecord) => {};
      const addProductInfo = async (props: AddProductInfoProps) => {
        completedProducts.push(productId);
        infos.total++;
        queue.total++;
        await handleLookupInfoProductInfo(
          salesDbName,
          hasEan,
          props,
          product,
          infos
        );
        await isProcessComplete(queue);
      };
      const handleNotFound = async (cause: NotFoundCause) => {
        completedProducts.push(productId);
        await handleLookupInfoNotFound(salesDbName, productId, asin);
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
        proxyType: sellerCentral.proxyType,
        targetShop: {
          prefix: '',
          d: shopDomain,
          name: shopDomain,
        },
        addProduct,
        lookupRetryLimit: 1,
        onNotFound: handleNotFound,
        addProductInfo,
        queue,
        query: {
          ...defaultQuery,
          product: {
            value: hasEan ? asin || ean || '' : asin || '',
            key: hasEan ? asin || ean || '' : asin || '',
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
