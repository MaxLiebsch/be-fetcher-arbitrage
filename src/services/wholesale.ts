import {
  QueryQueue,
  generateUpdate,
  querySellerInfosQueue,
  yieldQueues,
  globalEventEmitter,
  uuid,
  AddProductInfoProps,
  ProductRecord,
  NotFoundCause,
  DbProductRecord,
} from '@dipmaxtech/clr-pkg';
import _ from 'underscore';
import { handleResult } from '../handleResult.js';
import { MissingProductsError, MissingShopError } from '../errors.js';
import { getShop } from '../db/util/shops.js';
import { DEFAULT_CHECK_PROGRESS_INTERVAL } from '../constants.js';
import { checkProgress } from '../util/checkProgress.js';
import { lockWholeSaleProducts } from '../db/util/wholesaleSearch/lockWholeSaleProducts.js';
import { updateWholesaleProgress } from '../util/updateProgressInTasks.js';
import { upsertAsin } from '../db/util/asinTable.js';
import { WholeSaleTask } from '../types/tasks/Tasks.js';
import { WholeSaleStats } from '../types/taskStats/WholeSaleStats.js';
import { TaskReturnType } from '../types/TaskReturnType.js';
import { getProductLimitMulti } from '../util/getProductLimit.js';
import { log } from '../util/logger.js';
import { multiQueueInitializer } from '../util/multiQueueInitializer.js';
import { TaskCompletedStatus } from '../status.js';
import { countRemainingProductsShop } from '../util/countRemainingProducts.js';
import { hostname, wholeSaleColname } from '../db/mongo.js';
import { updateProductWithQuery } from '../db/util/crudProducts.js';
import { priceToString } from '../util/lookupInfoHelper.js';
import { getEanFromProduct } from '../util/getEanFromProduct.js';
import { checkForExistingAznProducts } from '../util/checkForExistingProducts.js';
import { setupAllowedDomainsBasedOnShops } from '../util/setupAllowedDomains.js';

export default async function wholesale(task: WholeSaleTask): TaskReturnType {
  return new Promise(async (resolve, reject) => {
    const { productLimit, _id: taskId, action, userId, type } = task;

    const wholesaleCandidates = await lockWholeSaleProducts(
      productLimit,
      taskId,
      action || 'none',
      'WHOLESALE_SEARCH'
    );

    const wholeSaleProducts = await checkForExistingAznProducts(
      wholesaleCandidates
    );

    if (action === 'recover') {
      log(`Recovering ${type} and found ${wholeSaleProducts.length} products`);
    } else {
      log(`Starting ${type} with ${wholeSaleProducts.length} products`);
    }

    let infos: WholeSaleStats = {
      total: 0,
      locked: 0,
      new: 0,
      old: 0,
      missingProperties: {
        costs: 0,
        price: 0,
        infos: 0,
      },
      notFound: 0,
      elapsedTime: '',
      failedSave: 0,
    };

    if (!wholeSaleProducts.length)
      return reject(new MissingProductsError(`No products`, task));

    const _productLimit = getProductLimitMulti(
      wholeSaleProducts.length,
      productLimit
    );
    log(`Product limit: ${_productLimit}`);

    infos.locked = wholeSaleProducts.length;

    //Update task progress
    await updateWholesaleProgress(taskId, 'WHOLESALE_SEARCH');

    const startTime = Date.now();

    const toolInfo = await getShop('sellercentral.amazon.de');

    if (!toolInfo) {
      return reject(
        new MissingShopError(`No shop found for sellercentral.amazon.de`, task)
      );
    }

    const queues: QueryQueue[] = [];
    const queuesWithId: { [key: string]: QueryQueue } = {};
    const eventEmitter = globalEventEmitter;
    await multiQueueInitializer(task, queuesWithId, queues, eventEmitter);
    await setupAllowedDomainsBasedOnShops([toolInfo], task.type) 
    const queueIterator = yieldQueues(queues);

    const isCompleted = async () => {
      const isDone = queues.every((q) => q.workload() === 0);
      if (isDone) {
        const check = await checkProgress({
          task,
          queue: queues,
          infos,
          startTime,
          productLimit: _productLimit,
        });
        if (check instanceof TaskCompletedStatus) {
          const remaining = await countRemainingProductsShop(
            wholeSaleColname,
            taskId,
            type
          );
          log(`Remaining products: ${remaining}`);
          clearInterval(interval);
          handleResult(check, resolve, reject);
        }
      }
      await updateWholesaleProgress(taskId, 'WHOLESALE_SEARCH');
    };

    const interval = setInterval(
      async () => await isCompleted(),
      DEFAULT_CHECK_PROGRESS_INTERVAL
    );

    for (let index = 0; index < wholeSaleProducts.length; index++) {
      const queue = queueIterator.next().value;
      queue.actualProductLimit++;
      const wholesaleProduct = wholeSaleProducts[index];
      const { _id: productId, prc } = wholesaleProduct;

      const ean = getEanFromProduct(wholesaleProduct);
      const asin = wholesaleProduct.asin;

      //not needed, I swear I will write clean code
      const addProduct = async (product: ProductRecord) => {};
      const addProductInfo = async ({
        productInfo,
        url,
      }: AddProductInfoProps) => {
        infos.total++;
        queue.total++;
        if (productInfo) {
          try {
            const { update, infoProp } = generateUpdate(
              productInfo,
              wholesaleProduct
            );

            let reducedCosts = { ...update.costs };
            delete reducedCosts.azn;
            if (update.asin && ean) await upsertAsin(update.asin, [ean]);
            const isComplete = infoProp === 'complete';
            const result = await updateProductWithQuery(productId, {
              $set: {
                ...update,
                info_prop: infoProp,
                a_pblsh: true,
                a_status: isComplete ? 'complete' : 'api',
                a_lookup_pending: false,
                a_locked: false,
              },
              $pull: { clrName: hostname },
            });
            log(`Updated: ${ean}`, result);
            if (result && result.acknowledged) {
              if (result.upsertedId) infos.new++;
              else infos.old++;
            } else {
              infos.failedSave++;
            }
          } catch (error) {
            if (error instanceof Error) {
              if (error.message === 'Asin mismatch') {
                infos.missingProperties.infos++;
              }
              const result = await updateProductWithQuery(productId, {
                $set: {
                  a_status: 'not found',
                  a_pblsh: true,
                  a_lookup_pending: false,
                  a_locked: false,
                },
                $pull: { clrName: hostname },
              });
              log(`Not found: ${ean}`, result);
              if (result && result.acknowledged) {
                if (result.upsertedId) infos.new++;
                else infos.old++;
              } else {
                infos.failedSave++;
              }
            }
          }
        } else {
          const result = await updateProductWithQuery(productId, {
            $set: {
              a_status: 'not found',
              a_pblsh: true,
              a_lookup_pending: false,
              a_locked: false,
            },
            $pull: { clrName: hostname },
          });
          log(`Product info missing: ${ean}`, result);
          if (result && result.acknowledged) {
            if (result.upsertedId) infos.new++;
            else infos.old++;
          } else {
            infos.failedSave++;
          }
        }
        await isCompleted();
      };

      const handleNotFound = async (cause: NotFoundCause) => {
        infos.notFound++;
        infos.total++;
        queue.total++;
        const result = await updateProductWithQuery(productId, {
          $set: {
            a_status: 'not found',
            a_pblsh: true,
            a_lookup_pending: false,
            a_locked: false,
          },
          $pull: { clrName: hostname },
        });
        log(`Not found: ${ean} - ${cause}`, result);
        if (result && result.acknowledged) {
          if (result.upsertedId) infos.new++;
          else infos.old++;
        } else {
          infos.failedSave++;
        }
        await isCompleted();
      };

      queue.pushTask(querySellerInfosQueue, {
        retries: 0,
        shop: toolInfo,
        requestId: uuid(),
        s_hash: productId.toString(),
        addProduct,
        targetShop: {
          prefix: '',
          d: `UserId: ${userId}`,
          name: `UserId: ${userId}`,
        },
        onNotFound: handleNotFound,
        addProductInfo,
        queue,
        query: {
          product: {
            value: asin || ean,
            key: asin || ean,
            price: priceToString(prc),
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
