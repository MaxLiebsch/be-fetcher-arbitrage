import { QueryQueue, Shop } from '@dipmaxtech/clr-pkg';
import { differenceInHours } from 'date-fns';
import { getShop } from '../../../db/util/shops.js';
import { TaskCompletedStatus } from '../../../status.js';
import { MAX_AGE_SHOP_LISTING, proxyAuth } from '../../../constants.js';
import { deleteProduct } from '../../../db/util/crudProducts.js';
import { getProductLimitMulti } from '../../../util/getProductLimit.js';
import { scrapeProductInfo } from '../../../util/deals/scrapeProductInfo.js';
import { updateProgressDealsOnEbyTasks } from '../../../util/updateProgressInTasks.js';
import { DealOnEbyTask } from '../../../types/tasks/Tasks.js';
import { DealsOnEbyStats } from '../../../types/taskStats/DealsOnEbyStats.js';
import { MissingShopError } from '../../../errors.js';
import { TaskReturnType } from '../../../types/TaskReturnType.js';
import { countRemainingProducts } from '../../../util/countRemainingProducts.js';
import { log } from '../../../util/logger.js';
import { findPendingProductsWithAggForTask } from '../../../db/util/multiShopUtilities/findPendingProductsWithAggForTask.js';
import { scrapeTotalOffers } from '../../../util/deals/scrapeTotalOffers.js';

const dealsOnEby = async (task: DealOnEbyTask): TaskReturnType => {
  const { productLimit } = task;
  const { _id: taskId, action, concurrency, type } = task;
  return new Promise(async (res, rej) => {
    const { products: productsWithShop, shops } =
      await findPendingProductsWithAggForTask(
        'DEALS_ON_EBY',
        taskId,
        action || 'none',
        productLimit
      );

    if (action === 'recover') {
      log(`Recovering ${type} and found ${productsWithShop.length} products`);
    } else {
      log(`Starting ${type} with ${productsWithShop.length} products`);
    }

    const eby = await getShop('ebay.de');

    if (!eby) {
      return rej(new MissingShopError('ebay.de', task));
    }

    const infos: DealsOnEbyStats = {
      total: 0,
      notFound: 0,
      locked: 0,
      new: 0,
      old: 0,
      scrapeProducts: {
        elapsedTime: '',
      },
      ebyListings: {
        elapsedTime: '',
      },
      missingProperties: {
        bsr: 0,
        mappedCat: 0,
        calculationFailed: 0,
        name: 0,
        price: 0,
        link: 0,
        image: 0,
      },
      elapsedTime: '',
    };

    const _productLimit = getProductLimitMulti(
      productsWithShop.length,
      productLimit
    );
    log('Product limit ' + _productLimit);
    infos.locked = productsWithShop.length;

    await updateProgressDealsOnEbyTasks();

    const queue = new QueryQueue(concurrency, proxyAuth, task);
    queue.actualProductLimit = _productLimit;
    await queue.connect();

    await Promise.all(
      productsWithShop.map(async (productWithShop) => {
        const { shop, product } = productWithShop;
        const source: Shop = shop as Shop;
        const { d: shopDomain } = source;
        const { esin, _id: productId } = product;

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
            await scrapeTotalOffers(
              queue,
              eby,
              source,

              {
                ...product,
                ...isValidProduct,
              },
              infos,
              { timestamp: 'dealEbyUpdatedAt', taskIdProp: 'dealEbyTaskId' }
            );
          } else {
            infos.total++;
            await deleteProduct(productId);
            log(`Deleted: ${shopDomain}-${productId}`);
            //DELETE PRODUCT
          }
        } else {
          await scrapeTotalOffers(queue, eby, source, product, infos, {
            timestamp: 'dealEbyUpdatedAt',
            taskIdProp: 'dealEbyTaskId',
          });
        }
      })
    );
    const remaining = await countRemainingProducts(shops, taskId, type);
    log(`Remaining products: ${remaining}`);
    await queue.clearQueue('DEALS_ON_EBY_COMPLETE', infos);
    return res(
      new TaskCompletedStatus('DEALS_ON_EBY_COMPLETE', task, {
        taskStats: infos,
        queueStats: queue.queueStats || {},
      })
    );
  });
};

export default dealsOnEby;
