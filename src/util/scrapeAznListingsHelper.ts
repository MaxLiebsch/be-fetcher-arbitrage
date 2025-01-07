import {
  AddProductInfoProps,
  DbProductRecord,
  detectCurrency,
  ObjectId,
  QueryQueue,
  safeParsePrice,
  resetAznProductQuery,
  replaceAllHiddenCharacters,
  retrieveAznArbitrageAndCosts,
  determineAdjustedSellPrice,
} from '@dipmaxtech/clr-pkg';

import { updateProductWithQuery } from '../db/util/crudProducts.js';
import { defaultAznDealTask } from '../constants.js';
import { NegDealsOnAznStats } from '../types/taskStats/NegDealsOnAzn.js';
import { DealsOnAznStats } from '../types/taskStats/DealsOnAznStats.js';
import { log } from './logger.js';
import { syncAznListings } from './syncAznListings.js';

export async function handleAznListingProductInfo(
  collection: string,
  product: DbProductRecord,
  { productInfo, url }: AddProductInfoProps,
  infos: NegDealsOnAznStats | DealsOnAznStats,
  queue: QueryQueue,
  processProps = defaultAznDealTask
) {
  let {
    costs,
    a_qty: sellQty = 1,
    qty: buyQty,
    a_prc: existingSellPrice,
    prc: buyPrice,
    tax,
    _id: productId,
  } = product;
  const { timestamp, taskIdProp } = processProps;
  infos.total++;
  queue.total++;

  if (productInfo) {
    const infoMap = new Map();
    productInfo.forEach((info) => infoMap.set(info.key, info.value));
    const price = infoMap.get('a_prc');
    const newSellPrice = safeParsePrice(price || '0');

    const image = infoMap.get('a_img');
    const a_reviewcnt = infoMap.get('a_reviewcnt');
    const a_rating = infoMap.get('a_rating');
    const rawName = infoMap.get('name');

    const {
      a_useCurrPrice,
      a_prc: newUsedListingPrice,
      a_uprc,
      avgPrice,
    } = determineAdjustedSellPrice(product, newSellPrice);

    if (newUsedListingPrice > 0) {
      if (costs && costs.azn > 0 && existingSellPrice) {
        const currency = detectCurrency(price);

        const arbitrageAndCosts = retrieveAznArbitrageAndCosts({
          oldListingPrice: existingSellPrice,
          listingPrice: newUsedListingPrice,
          sellQty,
          avgPrice,
          buyPrice,
          buyQty,
          a_useCurrPrice,
          costs,
          tax,
        });

        let taskUpdatedProp = timestamp;

        if (arbitrageAndCosts.a_mrgn && arbitrageAndCosts.a_mrgn > 0) {
          taskUpdatedProp = 'dealAznUpdatedAt';
        }

        const productUpdate: { [key in keyof DbProductRecord]: any } = {
          [taskUpdatedProp]: new Date().toISOString(),
          ...arbitrageAndCosts,
          a_prc: newUsedListingPrice,
          a_qty: sellQty,
          a_uprc,
          ...(typeof a_rating === 'string' && {
            a_rating: safeParsePrice(a_rating),
          }),
          ...(typeof a_reviewcnt === 'string' && {
            a_reviewcnt: safeParsePrice(a_reviewcnt),
          }),
          ...(rawName && { a_nm: replaceAllHiddenCharacters(rawName) }),
          ...(currency && { a_cur: currency }),
          ...(image && { a_img: image }),
          a_useCurrPrice,
        };

        const result = await updateProductWithQuery(productId, {
          $set: productUpdate,
          $unset: {
            [taskIdProp]: '',
          },
        });
        log(`Product info: ${collection}-${productId}`, result);

        await syncAznListings(productId, product.asin, productUpdate);
      } else {
        infos.missingProperties.aznCostNeg++;
        const result = await updateProductWithQuery(
          productId,
          resetAznProductQuery()
        );
        log(`Costs 0: ${collection}-${productId}`, result);
      }
    } else {
      infos.missingProperties.price++;
      const result = await updateProductWithQuery(
        productId,
        resetAznProductQuery()
      );
      log(`Price 0: ${collection}-${productId}`, result);
    }
  } else {
    infos.missingProperties.infos++;
    const result = await updateProductWithQuery(
      productId,
      resetAznProductQuery()
    );
    log(`No product info: ${collection}-${productId}`, result);
  }
}
export async function handleAznListingNotFound(
  collection: string,
  id: ObjectId
) {
  const result = await updateProductWithQuery(id, resetAznProductQuery());
  log(`Not found: ${collection}-${id}`, result);
}
