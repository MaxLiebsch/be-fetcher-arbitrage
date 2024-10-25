import {
  QueryQueue,
  reduceString,
  globalEventEmitter,
} from '@dipmaxtech/clr-pkg';
import { handleResult } from '../handleResult.js';
import { MissingProductsError, MissingShopError } from '../errors.js';
import { findShops, getShop } from '../db/util/shops.js';
import {
  CONCURRENCY,
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  defaultQuery,
  proxyAuth,
} from '../constants.js';
import { checkProgress } from '../util/checkProgress.js';
import { updateMatchProgress } from '../util/updateProgressInTasks.js';
import { getEanFromProduct } from '../util/getEanFromProduct.js';
import { TaskCompletedStatus } from '../status.js';
import { MatchProductsTask } from '../types/tasks/Tasks.js';
import { MatchProductsStats } from '../types/taskStats/MatchProductsStats.js';
import { TaskReturnType } from '../types/TaskReturnType.js';
import { getProductLimitMulti } from '../util/getProductLimit.js';
import { log } from '../util/logger.js';
import { countRemainingProductsShop } from '../util/countRemainingProducts.js';
import { findPendingProductsForMatchTask } from '../db/util/singleShopUtilities/findPendingProductsForMatchTask.js';
import queryAzn from '../util/match/queryAzn.js';
import queryEby from '../util/match/queryEby.js';
import { getProductsCol } from '../db/mongo.js';

export default async function matchProducts(
  task: MatchProductsTask,
): TaskReturnType {
  return new Promise(async (resolve, reject) => {
    const {
      shopDomain,
      concurrency,
      productLimit,
      _id: taskId,
      action,
      type,
    } = task;

    const srcShop = await getShop(shopDomain);
    if (!srcShop) return reject(new MissingShopError('', task));

    const shops = await findShops([shopDomain, 'amazon.de', 'ebay.de']);
    if (shops === null) return reject(new MissingShopError('', task));

    const { hasEan, ean } = srcShop;

    const eanProp = Boolean(hasEan || ean);

    const lockedProducts = await findPendingProductsForMatchTask(
      'MATCH_PRODUCTS',
      shopDomain,
      taskId,
      action || 'none',
      productLimit,
      eanProp,
    );

    if (action === 'recover') {
      log(`Recovering ${type} and found ${lockedProducts.length} products`);
    } else {
      log(`Starting ${type} with ${lockedProducts.length} products`);
    }

    let infos: MatchProductsStats = {
      total: 0,
      notFound: 0,
      locked: 0,
      elapsedTime: '',
    };

    if (!lockedProducts.length)
      return reject(
        new MissingProductsError(`No products for ${shopDomain}`, task),
      );

    const _productLimit = getProductLimitMulti(
      lockedProducts.length,
      productLimit,
    );
    log(`${taskId} Product limit: ${_productLimit}`);

    infos.locked = lockedProducts.length;

    let totalQueueTasks = 0;

    //Update task progress
    await updateMatchProgress(shopDomain, eanProp);

    const startTime = Date.now();

    const queue = new QueryQueue(
      concurrency ? concurrency : CONCURRENCY,
      proxyAuth,
      task,
    );
    await queue.connect();

    let completed = false;

    const eventEmitter = globalEventEmitter;

    eventEmitter.on(`${queue.queueId}-finished`, async () => {
      await isProcessComplete();
    });

    async function isProcessComplete() {
      const check = await checkProgress({
        task,
        queue,
        infos,
        startTime,
        productLimit: totalQueueTasks,
      });
      if (check instanceof TaskCompletedStatus && !completed) {
        completed = true;
        const remaining = await countRemainingProductsShop(
          shopDomain,
          taskId,
          type,
        );
        log(`Remaining products: ${remaining}`);
        clearInterval(interval);
        await updateMatchProgress(shopDomain, hasEan); // update match progress
        handleResult(check, resolve, reject);
      } else if (check !== undefined && completed) {
        log(`Task already completed ${completed}`);
      }
    }
    const interval = setInterval(
      async () => await isProcessComplete(),
      DEFAULT_CHECK_PROGRESS_INTERVAL,
    );

    const doneProductsBulk = [];

    const azn = shops['amazon.de'];
    const eby = shops['ebay.de'];

    for (let index = 0; index < lockedProducts.length; index++) {
      const product = lockedProducts[index];
      const { nm, mnfctr, _id: productId, eby_prop, azn_prop } = product;
      const ean = getEanFromProduct(product);

      let reducedName = reduceString(nm, 55);

      if (mnfctr !== undefined) {
        reducedName = `${mnfctr} ${reducedName}`;
      }

      const query = {
        ...defaultQuery,
        product: {
          key: reducedName,
          value: ean || reducedName,
        },
        category: 'default',
      };

      if (azn_prop === undefined) {
        totalQueueTasks++;
        queryAzn({
          queue,
          azn,
          infos,
          query,
          product,
          shopDomain,
        });
      } else {
        doneProductsBulk.push({
          updateOne: {
            filter: { _id: productId },
            update: {
              $set: {
                azn_taskId: '',
              }
            },
          },
        });
      }

      if (eby_prop === undefined) {
        totalQueueTasks++;
        queryEby({
          queue,
          eby,
          infos,
          query,
          product,
          shopDomain,
        });
      } else {
        doneProductsBulk.push({
          updateOne: {
            filter: { _id: productId },
            update: {
              $set: {
                eby_taskId: '',
              }
            },
          },
        });
      }
    }
    const col = await getProductsCol();
    if (doneProductsBulk.length) await col.bulkWrite(doneProductsBulk);

    queue.actualProductLimit = totalQueueTasks;
    log(`Total queue tasks: ${totalQueueTasks} started...`);
  });
}
