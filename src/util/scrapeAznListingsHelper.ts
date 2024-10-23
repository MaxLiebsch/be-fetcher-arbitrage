import {
  AddProductInfoProps,
  calculateAznArbitrage,
  DbProductRecord,
  detectCurrency,
  ObjectId,
  QueryQueue,
  safeParsePrice,
  resetAznProductQuery,
  replaceAllHiddenCharacters,
  getAznAvgPrice,
  roundToTwoDecimals,
} from '@dipmaxtech/clr-pkg';

import { updateProductWithQuery } from '../db/util/crudProducts.js';
import { defaultAznDealTask } from '../constants.js';
import { NegDealsOnAznStats } from '../types/taskStats/NegDealsOnAzn.js';
import { DealsOnAznStats } from '../types/taskStats/DealsOnAznStats.js';
import { log } from './logger.js';

export async function handleAznListingProductInfo(
  collection: string,
  product: DbProductRecord,
  { productInfo, url }: AddProductInfoProps,
  infos: NegDealsOnAznStats | DealsOnAznStats,
  queue: QueryQueue,
  processProps = defaultAznDealTask,
) {
  let {
    costs,
    a_qty: sellQty,
    qty: buyQty,
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
    const image = infoMap.get('a_img');
    const a_reviewcnt = infoMap.get('a_reviewcnt');
    const a_rating = infoMap.get('a_rating');
    const rawName = infoMap.get('name');
    const parsedPrice = safeParsePrice(price || '0');

    const { a_useCurrPrice, a_prc, a_uprc, avgPrice } = getAznAvgPrice(
      product,
      parsedPrice,
    );

    if (a_prc > 0) {
      if (costs && costs.azn > 0) {
        const currency = detectCurrency(price);
        
        if(!a_useCurrPrice){
          costs.azn = roundToTwoDecimals((costs.azn / a_prc) * avgPrice);
        }

        const arbitrage = calculateAznArbitrage(
          buyPrice * (sellQty! / buyQty),
          a_useCurrPrice ? a_prc : avgPrice,
          costs,
          tax,
        );
        const productUpdate: { [key in keyof DbProductRecord]: any } = {
          [timestamp]: new Date().toISOString(),
          a_prc,
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
          ...arbitrage,
        };

        const result = await updateProductWithQuery(productId, {
          $set: productUpdate,
          $unset: {
            [taskIdProp]: '',
          },
        });
        log(`Product info: ${collection}-${productId}`, result);
      } else {
        infos.missingProperties.aznCostNeg++;
        const result = await updateProductWithQuery(
          productId,
          resetAznProductQuery(),
        );
        log(`Costs 0: ${collection}-${productId}`, result);
      }
    } else {
      infos.missingProperties.price++;
      const result = await updateProductWithQuery(
        productId,
        resetAznProductQuery(),
      );
      log(`Price 0: ${collection}-${productId}`, result);
    }
  } else {
    infos.missingProperties.infos++;
    const result = await updateProductWithQuery(
      productId,
      resetAznProductQuery(),
    );
    log(`No product info: ${collection}-${productId}`, result);
  }
}
export async function handleAznListingNotFound(
  collection: string,
  id: ObjectId,
) {
  const result = await updateProductWithQuery(id, resetAznProductQuery());
  log(`Not found: ${collection}-${id}`, result);
}
