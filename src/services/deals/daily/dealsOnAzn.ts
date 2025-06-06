import {
  DbProductRecord,
  QueryQueue,
  recalculateAznMargin,
  Shop,
} from '@dipmaxtech/clr-pkg';
import { differenceInHours } from 'date-fns';
import { TaskCompletedStatus } from '../../../status.js';
import { MAX_AGE_SHOP_LISTING, proxyAuth } from '../../../constants.js';
import {
  deleteProduct,
  updateProductWithQuery,
} from '../../../db/util/crudProducts.js';
import { getProductLimitMulti } from '../../../util/getProductLimit.js';
import { scrapeProductInfo } from '../../../util/deals/scrapeProductInfo.js';
import { updateProgressDealsOnAznTasks } from '../../../util/updateProgressInTasks.js';
import { DealsOnAznStats } from '../../../types/taskStats/DealsOnAznStats.js';
import { DealOnAznTask } from '../../../types/tasks/Tasks.js';
import { TaskReturnType } from '../../../types/TaskReturnType.js';
import { log } from '../../../util/logger.js';
import { countRemainingProducts } from '../../../util/countRemainingProducts.js';
import { findPendingProductsForTask } from '../../../db/util/multiShopUtilities/findPendingProductsForTask.js';
import { ShopPick } from '../../../types/shops.js';
import { setupAllowedDomainsBasedOnShops } from '../../../util/setupAllowedDomains.js';

const dealsOnAzn = async (task: DealOnAznTask): TaskReturnType => {
  const { productLimit } = task;
  const { _id: taskId, action, concurrency, type } = task;
  return new Promise(async (res, rej) => {
    const { products: productsWithShop, shops } =
      await findPendingProductsForTask(
        'DEALS_ON_AZN',
        taskId,
        action || 'none',
        productLimit
      );

    if (action === 'recover') {
      log(`Recovering ${type} and found ${productsWithShop.length} products`);
    } else {
      log(`Starting ${type} with ${productsWithShop.length} products`);
    }

    const infos: DealsOnAznStats = {
      total: 0,
      new: 0,
      old: 0,
      notFound: 0,
      elapsedTime: '',
      locked: 0,
      scrapeProducts: {
        elapsedTime: '',
      },
      aznListings: {
        elapsedTime: '',
      },
      missingProperties: {
        bsr: 0,
        mappedCat: 0,
        aznCostNeg: 0,
        infos: 0,
        calculationFailed: 0,
        name: 0,
        price: 0,
        link: 0,
        image: 0,
      },
    };

    const _productLimit = getProductLimitMulti(
      productsWithShop.length,
      productLimit
    );
    log('Product limit ' + _productLimit);
    infos.locked = productsWithShop.length;

    await updateProgressDealsOnAznTasks();

    const queue = new QueryQueue(concurrency, proxyAuth, task);
    queue.actualProductLimit = _productLimit;
    await setupAllowedDomainsBasedOnShops([...shops.map(shop => shop.shop)], task.type);
    await queue.connect();

    await Promise.all(
      productsWithShop.map(
        async (productWithShop: {
          shop: ShopPick;
          product: DbProductRecord;
        }) => {
          const { shop, product } = productWithShop;
          const { _id: productId, availUpdatedAt, updatedAt } = product;
          const source: Shop = shop as Shop;
          const { d: shopDomain } = source;
          let diffHours = null;
          if (availUpdatedAt) {
            diffHours = differenceInHours(new Date(), new Date(availUpdatedAt));
          }
          if (!diffHours || diffHours >= MAX_AGE_SHOP_LISTING) {
            const isValidProduct = await scrapeProductInfo(
              queue,
              source,
              product
            );
            if (isValidProduct) {
              product.prc = isValidProduct.prc || product.prc;
              const productUpdate: Partial<DbProductRecord> = {};
              recalculateAznMargin(product, product.a_prc || 0, productUpdate);
              await updateProductWithQuery(productId, {
                $set: {
                  ...productUpdate,
                  dealAznUpdatedAt: new Date().toISOString(),
                },
                $unset: { dealAznTaskId: '' },
              });
            } else {
              await deleteProduct(productId);
              log(`Deleted: ${shopDomain}-${productId}`);
            }
            infos.total++;
          } else {
            const productUpdate: Partial<DbProductRecord> = {};
            recalculateAznMargin(product, product.a_prc || 0, productUpdate);
            await updateProductWithQuery(productId, {
              $set: {
                dealAznUpdatedAt: new Date().toISOString(),
                ...productUpdate,
              },
              $unset: { dealAznTaskId: '' },
            });
            infos.total++;
          }
        }
      )
    );
    const remaining = await countRemainingProducts(shops, taskId, type);
    log(`Remaining products: ${remaining}`);
    await queue.clearQueue('DEALS_ON_AZN_COMPLETE', infos);
    res(
      new TaskCompletedStatus('DEALS_ON_AZN_COMPLETE', task, {
        taskStats: infos,
        queueStats: queue.queueStats,
      })
    );
  });
};

export default dealsOnAzn;
