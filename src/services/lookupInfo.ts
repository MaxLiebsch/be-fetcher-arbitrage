import {
  AddProductInfoProps,
  DbProductRecord,
  NotFoundCause,
  ProductRecord,
  Query,
  QueryQueue,
  determineAdjustedSellPrice,
  globalEventEmitter,
  querySellerInfosQueue,
  uuid,
  yieldQueues,
} from '@dipmaxtech/clr-pkg';
import _, { max } from 'underscore';
import { handleResult } from '../handleResult.js';
import { CONCURRENCY, defaultQuery, proxyAuth } from '../constants.js';
import { checkProgress } from '../util/checkProgress.js';
import { getShop } from '../db/util/shops.js';
import {
  handleLookupInfoNotFound,
  handleLookupInfoProductInfo,
  priceToString,
} from '../util/lookupInfoHelper.js';
import { getProductLimitMulti } from '../util/getProductLimit.js';
import { getEanFromProduct } from '../util/getEanFromProduct.js';
import { TaskCompletedStatus } from '../status.js';
import { LookupInfoStats } from '../types/taskStats/LookupInfoStats.js';
import { getMaxLoadQueue } from '../util/getMaxLoadQueue.js';
import { LookupInfoTask } from '../types/tasks/Tasks.js';
import { TaskReturnType } from '../types/TaskReturnType.js';
import { countRemainingProducts } from '../util/countRemainingProducts.js';
import { setTaskId } from '../db/util/queries.js';
import { MissingProductsError } from '../errors.js';
import { MissingShopError } from '../errors.js';
import { log } from '../util/logger.js';
import { findPendingProductsForTask } from '../db/util/multiShopUtilities/findPendingProductsForTask.js';
import { uniqueDocuments } from '../util/uniqueDocuments.js';
import { eansReduce } from '../util/eansReduce.js';
import { findExistingProdutAsins } from '../util/checkForExistingProducts.js';
import { updateProductWithQuery } from '../db/util/crudProducts.js';
import { setupAllowedDomainsBasedOnShops } from '../util/setupAllowedDomains.js';

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
      elapsedTime: '',
      missingProperties: {
        price: 0,
        costs: 0,
        infos: 0,
      },
    };

    const productsAndShops = await findPendingProductsForTask(
      'LOOKUP_INFO',
      taskId,
      action || 'none',
      productLimit
    );

    const { products, shops } = await uniqueDocuments(
      'LOOKUP_INFO',
      productsAndShops,
      taskId
    );

    log(`Found ${products.length} products`);

    shops.forEach(async (info) => {
      infos.shops[info.shop.d] = 0;
    });

    if (!products.length)
      return reject(new MissingProductsError(`No products ${type}`, task));

    const _productLimit = getProductLimitMulti(products.length, productLimit);
    log(`Product limit: ${_productLimit}`);

    const toolInfo = await getShop('sellercentral.amazon.de');

    if (!toolInfo) {
      return reject(
        new MissingShopError(`No shop found for sellercentral.amazon.de`, task)
      );
    }

    infos.locked = products.length;

    const startTime = Date.now();

    const queryQueues: QueryQueue[] = [];
    const queuesWithId: { [key: string]: QueryQueue } = {};
    const eventEmitter = globalEventEmitter;
    let completed = false;
    let cnt = 0;

    const isCompleted = async () => {
      const check = await checkProgress({
        task,
        queue: queryQueues,
        infos,
        startTime,
        productLimit: _productLimit,
      });
      if (check instanceof TaskCompletedStatus && !completed) {
        completed = true;
        const remaining = await countRemainingProducts(shops, taskId, type);
        log(`Completed: Rest: ${remaining}, taskId ${setTaskId(taskId)}`);
        handleResult(check, resolve, reject);
      } else if (check !== undefined && completed) {
        cnt++;
        log(`Completed: ${completed} ${cnt}`);
      } else {
        log(
          `${queryQueues
            .map((q) => `Q: ${q.queueId.slice(0, 5)} L:${q.workload()}`)
            .join(',')}`
        );
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
          eventEmitter.on(
            `${queue.queueId}-finished`,
            async function lookupInfoCallback({ queueId }) {
              const maxQueue = getMaxLoadQueue(queryQueues);
              const tasks = maxQueue.pullTasksFromQueue();
              if (tasks) {
                maxQueue.actualProductLimit -= tasks.length;
                log(
                  `Adding ${tasks.length} tasks from ${maxQueue.queueId} to ${queueId}`
                );
                queuesWithId[queueId].addTasksToQueue(tasks);
                queuesWithId[queueId].actualProductLimit += tasks.length;
              } else if (queuesWithId[queueId].workload() === 0) {
                log('No more tasks to distribute. Closing ' + queueId);
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
                  log('All queues are done');
                  await isCompleted();
                }
              } else {
                log(
                  `${queuesWithId[queueId].workload()} tasks left in ${queueId}`
                );
              }
            }
          );
          queryQueues.push(queue);
          return queue.connect();
        }
      )
    );
    await setupAllowedDomainsBasedOnShops([toolInfo], task.type) 
    const queueIterator = yieldQueues(queryQueues);

    const eans = eansReduce(
      products.reduce<DbProductRecord[]>((acc, { product }) => {
        acc.push(product);
        return acc;
      }, [])
    );
    const existingAsins = await findExistingProdutAsins(eans);

    for (let index = 0; index < products.length; index++) {
      const queue = queueIterator.next().value as QueryQueue;
      queue.actualProductLimit++;
      const { product, shop } = products[index];
      const shopDomain = shop.d;
      const hasEan = Boolean(shop.hasEan || shop?.ean);
      let { asin, _id: productId, s_hash, prc } = product;
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

      const addProduct = async (product: ProductRecord) => {};
      const addProductInfo = async (props: AddProductInfoProps) => {
        await handleLookupInfoProductInfo(
          shopDomain,
          hasEan,
          props,
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
        await handleLookupInfoNotFound(shopDomain, productId, asin);
        infos.shops[shopDomain]++;
        infos.total++;
        queue.total++;
        await isCompleted();
      };

      const { avgPrice, a_useCurrPrice, a_prc } = determineAdjustedSellPrice(
        product,
        product.a_prc || 0
      );

      const query: Query = {
        ...defaultQuery,
        product: {
          value: hasEan ? asin || ean || '' : asin || '',
          key: hasEan ? asin || ean || '' : asin || '',
          price: a_useCurrPrice
            ? priceToString(a_prc)
            : avgPrice > 0
            ? priceToString(avgPrice)
            : priceToString(prc),
        },
      };
      queue.pushTask(querySellerInfosQueue, {
        retries: 0,
        shop: toolInfo,
        s_hash,
        proxyType: toolInfo.proxyType,
        requestId: uuid(),
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
