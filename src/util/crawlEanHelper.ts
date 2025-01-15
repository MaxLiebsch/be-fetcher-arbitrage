import {
  AddProductInfoProps,
  CrawlEanProps,
  DbProductRecord,
  deliveryTime,
  detectCurrency,
  NotFoundCause,
  ObjectId,
  QueryQueue,
  removeSearchParams,
  roundToTwoDecimals,
  safeParsePrice,
} from '@dipmaxtech/clr-pkg';
import {
  deleteProduct,
  insertProduct,
  updateProductWithQuery,
} from '../db/util/crudProducts.js';
import { createHash } from './hash.js';

import { ScrapeEanStats } from '../types/taskStats/ScrapeEanStats.js';
import { ScrapeEansTask } from '../types/tasks/Tasks.js';
import { DailySalesTask } from '../types/tasks/DailySalesTask.js';
import { log } from './logger.js';
import { formatEan } from './lookupCategoryHelper.js';

export async function handleCrawlEanProductInfo(
  collectionName: string,
  { productInfo, url }: AddProductInfoProps,
  queue: QueryQueue,
  product: DbProductRecord,
  taskStats: ScrapeEanStats,
  task: ScrapeEansTask | DailySalesTask | null = null
) {
  const { _id: productId, lnk: productLink, qty: buyQty } = product;

  if (productInfo) {
    const infoMap = new Map();
    productInfo.forEach((info) => infoMap.set(info.key, info.value));
    let ean = infoMap.get('ean');
    let isEan =
      ean && /\b[0-9]{11,13}\b/.test(ean) && !ean.toString().startsWith('99');

    if (isEan) {
      ean = formatEan(ean);
      const rawPrice = infoMap.get('price');
      const prc = safeParsePrice(rawPrice || 0);
      const currency = detectCurrency(rawPrice);
      const sku = infoMap.get('sku');
      const image = infoMap.get('image');
      const mku = infoMap.get('mku');
      const inStock = infoMap.get('instock');

      const productUpdate = {
        eanUpdatedAt: new Date().toISOString(),
        ean_prop: CrawlEanProps.found,
        eanList: [ean],
        ...(prc && { prc, uprc: roundToTwoDecimals(prc / buyQty) }),
        ...(currency && { cur: currency }),
        ...(image && { img: image }),
        ...(sku && { sku }),
        ...(mku && { mku }),
      };
      if (task && 'queryEansOnEby' in task.progress) {
        task.progress.queryEansOnEby.push(productId);
        task.progress.lookupInfo.push(productId);
      }
      if (inStock) {
        const stockStr = deliveryTime(inStock);
        if (stockStr) {
          productUpdate['a'] = stockStr;
        }
      }

      if (url === productLink) {
        const result = await updateProductWithQuery(productId, {
          $set: productUpdate,
          $unset: { ean_taskId: '' },
        });
        log(`Product info updated: ${collectionName}-${productId}`, result);
      } else {
        const result = await deleteProduct(productId);
        log(`Product deleted: ${collectionName}-${productId}`, result);
        if (result.deletedCount === 1) {
          url = removeSearchParams(url);
          const s_hash = createHash(url);
          delete product.ean_taskId;
          const result = await insertProduct({
            ...product,
            ...productUpdate,
            lnk: url,
            s_hash,
          });
          log(`Product info updated: ${collectionName}-${productId}`, result);
        }
      }
    } else {
      taskStats.missingProperties[collectionName]['ean']++;
      const productUpdate = {
        eanUpdatedAt: new Date().toISOString(),
        ean_prop: ean ? CrawlEanProps.invalid : CrawlEanProps.missing,
      };
      const result = await updateProductWithQuery(productId, {
        $set: productUpdate,
        $unset: { ean_taskId: '' },
      });
      log(`Invalid ean: ${collectionName}-${productId}`, result);
    }
  } else {
    const result = await updateProductWithQuery(productId, {
      $set: {
        ean_prop: CrawlEanProps.invalid,
        eanUpdatedAt: new Date().toISOString(),
      },
      $unset: {
        ean_taskId: '',
      },
    });
    log(`Invalid ean: ${collectionName}-${productId}`, result);
  }
  taskStats.shops![collectionName]++;
  taskStats.total++;
  queue.total++;
}
export async function handleCrawlEanNotFound(
  collection: string,
  cause: NotFoundCause,
  productId: ObjectId
) {
  if (cause === 'exceedsLimit' || cause === 'timeout') {
    const result = await updateProductWithQuery(productId, {
      $set: {
        ean_prop: CrawlEanProps.timeout,
        eanUpdatedAt: new Date().toISOString(),
      },
      $unset: {
        ean_taskId: '',
      },
    });
    log(`ExceedsLimit: ${collection}-${productId} - ${cause}`, result);
  } else if (cause === 'notFound') {
    const result = await deleteProduct(productId);
    log(`Deleted: ${collection}-${productId} - ${cause}`, result);
  }
}
