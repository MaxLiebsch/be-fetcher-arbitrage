import {
  DbProductRecord,
  QueryQueue,
  recalculateAznMargin,
  Shop,
} from '@dipmaxtech/clr-pkg';
import { differenceInHours } from 'date-fns';
import { getShop } from '../../../db/util/shops.js';
import { TaskCompletedStatus } from '../../../status.js';
import { MAX_AGE_SHOP_LISTING, proxyAuth } from '../../../constants.js';
import {
  deleteProduct,
  updateProductWithQuery,
} from '../../../db/util/crudProducts.js';
import { getProductLimitMulti } from '../../../util/getProductLimit.js';
import { scrapeProductInfo } from '../../../util/deals/scrapeProductInfo.js';
import { updateProgressNegDealAznTasks } from '../../../util/updateProgressInTasks.js';
import { NegAznDealTask } from '../../../types/tasks/Tasks.js';
import { NegDealsOnAznStats } from '../../../types/taskStats/NegDealsOnAzn.js';
import { MissingShopError, TaskErrors } from '../../../errors.js';
import { TaskReturnType } from '../../../types/TaskReturnType.js';
import { log } from '../../../util/logger.js';
import { countRemainingProducts } from '../../../util/countRemainingProducts.js';
import { findPendingProductsForTask } from '../../../db/util/multiShopUtilities/findPendingProductsForTask.js';

const negAznDeals = async (task: NegAznDealTask): TaskReturnType => {
  const { productLimit } = task;
  const { _id: taskId, action, concurrency, type } = task;
  return new Promise<TaskCompletedStatus | TaskErrors>(async (res, rej) => {
    const { products, shops } = await findPendingProductsForTask(
      'NEG_AZN_DEALS',
      taskId,
      action || 'none',
      productLimit
    );

    if (action === 'recover') {
      log(`Recovering ${type} and found ${products.length} products`);
    } else {
      log(`Starting ${type} with ${products.length} products`);
    }

    const azn = await getShop('amazon.de');

    if (!azn) {
      return rej(new MissingShopError('amazon.de', task));
    }

    const infos: NegDealsOnAznStats = {
      total: 0,
      notFound: 0,
      locked: 0,
      scrapeProducts: {
        elapsedTime: '',
      },
      ebyListings: {
        elapsedTime: '',
      },
      missingProperties: {
        price: 0,
        infos: 0,
        aznCostNeg: 0,
      },
      elapsedTime: '',
    };

    const _productLimit = getProductLimitMulti(products.length, productLimit);
    log(`Product limit: ${_productLimit}`);
    infos.locked = products.length;

    await updateProgressNegDealAznTasks();

    const queue = new QueryQueue(concurrency, proxyAuth, task);
    queue.actualProductLimit = _productLimit;
    await queue.connect();

    await Promise.all(
      products.map(async (productShop) => {
        const { product, shop } = productShop;
        const source = shop as Shop;
        const { d: shopDomain } = source;
        const { asin, _id: productId } = product;
        const diffHours = differenceInHours(
          new Date(),
          new Date(product.availUpdatedAt || product.updatedAt)
        );
        if (diffHours >= MAX_AGE_SHOP_LISTING) {
          const isValidProduct = await scrapeProductInfo(
            queue,
            source,
            product
          );
          if (isValidProduct) {
            product.prc = isValidProduct.prc || product.prc;
            const productUpdate: Partial<DbProductRecord> = {};
            recalculateAznMargin(product, product.a_prc || 0, productUpdate);
            // WE DONT NEED TO SCRAPE AZN LISTINGS
            await updateProductWithQuery(productId, {
              $set: {
                ...productUpdate,
                aznUpdatedAt: new Date().toISOString(),
              },
              $unset: { azn_taskId: '' },
            });
          } else {
            log(`Deleted: ${shopDomain}-${productId}`);
            await deleteProduct(productId);
          }
          infos.total++;
        } else {
          const productUpdate: Partial<DbProductRecord> = {};
          recalculateAznMargin(product, product.a_prc || 0, productUpdate);
          // WE DONT NEED TO SCRAPE AZN LISTINGS
          await updateProductWithQuery(productId, {
            $set: {
              ...productUpdate,
              aznUpdatedAt: new Date().toISOString(),
            },
            $unset: { azn_taskId: '' },
          });
          infos.total++
        }
      })
    );
    const remaining = await countRemainingProducts(shops, taskId, type);
    log(`Remaining products: ${remaining}`);
    await queue.clearQueue('CRAWL_AZN_LISTINGS_COMPLETE', infos);
    res(
      new TaskCompletedStatus('CRAWL_AZN_LISTINGS_COMPLETE', task, {
        taskStats: infos,
        queueStats: queue.queueStats,
      })
    );
  });
};

export default negAznDeals;
