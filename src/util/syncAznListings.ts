import {
  DbProductRecord,
  LookupInfoProps,
  ObjectId,
  recalculateAznMargin,
  safeParsePrice,
} from '@dipmaxtech/clr-pkg';
import { getProductsCol } from '../db/mongo';
import { findProducts } from '../db/util/crudProducts';
import { log } from './logger';

export async function syncAznListings(
  productId: ObjectId,
  asin: string | undefined,
  update: Partial<DbProductRecord>
) {
  const { costs: newCosts, a_prc: newSellPrice } = update;

  if (!asin) return;

  if (newCosts && newCosts?.azn > 0 && newSellPrice) {
    const products = await findProducts({
      asin: asin,
      _id: { $ne: productId },
    });
    let bulks: any = [];
    for (const product of products) {
      const { _id, costs, a_prc: existingSellPrice, a_mrgn } = product;

      const isComplete = a_mrgn && existingSellPrice && costs?.azn;

      const info_prop = isComplete
        ? LookupInfoProps.complete
        : update.info_prop;

      let productUpdate: Partial<DbProductRecord> = {};
      if (existingSellPrice) {
        // recalculate azn costs for existing listing

        product['costs'] = {
          ...costs,
          ...newCosts,
        };
        product['a_prc'] = newSellPrice;
        recalculateAznMargin(product, newSellPrice, productUpdate);
        productUpdate = {
          ...productUpdate,
          costs: product['costs'],
          a_pblsh: true,
          bsr: update.bsr || product.bsr || [],
          a_qty: update.a_qty,
          a_nm: update.a_nm,
          a_prc: newSellPrice,
          a_uprc: update.a_uprc,
        };
      } else {
        product['costs'] = newCosts;
        product['a_prc'] = newSellPrice;
        recalculateAznMargin(product, newSellPrice, productUpdate);
        const {
          a_rating,
          a_reviewcnt,
          tax,
          a_qty,
          totalOfferCount,
          buyBoxIsAmazon,
        } = update;

        productUpdate = {
          ...productUpdate,
          costs: {
            ...costs,
            ...newCosts,
          },
          a_prc: newSellPrice,
          a_uprc: update.a_uprc,
          bsr: update.bsr || product.bsr || [],
          a_qty,
          a_pblsh: true,
          a_nm: update.a_nm,
          a_img: update.a_img,
          ...(a_rating && { a_rating: safeParsePrice(a_rating) }),
          ...(a_reviewcnt && { a_reviewcnt: safeParsePrice(a_reviewcnt) }),
          ...(tax && { tax: Number(tax) }),
          ...(totalOfferCount && {
            totalOfferCount,
          }),
          ...(buyBoxIsAmazon !== undefined && {
            buyBoxIsAmazon,
          }),
        };
      }
      if (Object.keys(productUpdate).length > 0) {
        let taskUpdatedProp = 'aznUpdatedAt';

        if (update.a_mrgn && update.a_mrgn > 0) {
          taskUpdatedProp = 'dealAznUpdatedAt';
        }

        const _update = {
          $set: {
            ...productUpdate,
            info_prop,
            [taskUpdatedProp]: new Date().toISOString(),
            infoUpdatedAt: new Date().toISOString(),
          },
          $unset: { info_taskId: '' },
        };
        bulks.push({ updateOne: { filter: { _id }, update: _update } });
      }
    }
    if (bulks.length > 0) {
      const col = await getProductsCol();
      const result = await col.bulkWrite(bulks);
      log(`Updated other products: ${asin}`, result);
    }
  }
}
