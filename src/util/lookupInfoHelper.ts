import {
  AddProductInfoProps,
  DbProductRecord,
  generateUpdate,
  generateMinimalUpdate,
  ObjectId,
  replaceAllHiddenCharacters,
  LookupInfoCause,
  LookupInfoPropType,
  getAznAvgPrice,
  calcAznCosts,
  safeParsePrice,
} from '@dipmaxtech/clr-pkg';
import { upsertAsin } from '../db/util/asinTable.js';
import { LookupInfoStats } from '../types/taskStats/LookupInfoStats.js';
import {
  findProducts,
  updateProducts,
  updateProductWithQuery,
} from '../db/util/crudProducts.js';
import { log } from './logger.js';
import { lookupInfoStandardUpdate } from '../db/util/queries.js';
import { getProductsCol } from '../db/mongo.js';
import { recalculateAznMargin } from './recalculateAznMargin.js';

const handleOtherProducts = async (
  asin: string,
  update: any,
  errorMessage: string
) => {
  const result = await updateProducts(
    {
      asin: asin,
    },
    {
      ...update,
    }
  );

  if (result.modifiedCount > 0) {
    log(errorMessage);
  }
};

const handleProductsUpdate = async (
  productId: ObjectId,
  asin: string | undefined,
  update: Partial<DbProductRecord>
) => {
  const { costs: newCosts, a_prc: newSellPrice } = update;

  if (asin && newCosts && newCosts?.azn > 0 && newSellPrice) {
    const products = await findProducts({
      asin: asin,
      _id: { $ne: productId },
    });
    let bulks: any = [];
    for (const product of products) {
      const { _id, costs, a_prc } = product;
      let productUpdate: Partial<DbProductRecord> = {};
      if (a_prc) {
        // recalculate azn costs for existing listing
        const { avgPrice, a_useCurrPrice } = getAznAvgPrice(product, a_prc);
        const aznCosts = calcAznCosts(
          newCosts,
          newSellPrice,
          a_useCurrPrice ? a_prc : avgPrice
        );

        if (aznCosts) {
          product['costs'] = {
            ...newCosts,
            ...costs,
            azn: aznCosts,
          };
          recalculateAznMargin(product, productUpdate);
          productUpdate['costs'] = product['costs'];
          productUpdate = {
            ...productUpdate,
            bsr: update.bsr || product.bsr || [],
            a_qty: update.a_qty,
            a_nm: update.a_nm,
            a_useCurrPrice,
          };
        }
      } else {
        product.costs = newCosts;
        product.a_prc = newSellPrice;
        recalculateAznMargin(product, productUpdate);
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
          costs: newCosts,
          a_prc: newSellPrice,
          a_uprc: update.a_uprc,
          bsr: update.bsr || product.bsr || [],
          a_qty,
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
        console.log(product.sdmn, 'productUpdate:', productUpdate);
        const _update = {
          $set: {
            ...productUpdate,
            info_prop: update.info_prop,
            aznUpdatedAt: new Date().toISOString(),
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
};

const handleProductUpdate = async (
  productId: ObjectId,
  cause: string,
  asin: string | undefined,
  update: Partial<DbProductRecord>
) => {
  await handleProductsUpdate(productId, asin, update);

  const result = await updateProductWithQuery(productId, {
    $set: {
      ...update,
    },
    $unset: { info_taskId: '' },
  });
  log(`Updated infos: ${productId.toString()} ${cause}`, result);
};

const causeToInfoPropMap: { [key in LookupInfoCause]: LookupInfoPropType } = {
  completeInfo: 'complete',
  missingSellerRank: 'no_bsr',
  incompleteInfo: 'incomplete',
};

export async function handleLookupInfoProductInfo(
  collection: string,
  hasEan: boolean,
  { productInfo, url, cause }: AddProductInfoProps,
  product: DbProductRecord,
  infos: LookupInfoStats
) {
  console.log(
    product.eanList && product.eanList[0],
    product.asin,
    cause,
    'ProductInfo:',
    productInfo
  );
  const { a_vrfd, _id: productId, eanList } = product;

  if (productInfo) {
    try {
      if (cause === 'completeInfo') {
        let { update, infoProp } = generateUpdate(productInfo, product);

        const { costs, a_nm, asin } = update;

        update['a_orgn'] = 'a';
        update['a_pblsh'] = true;

        if (hasEan && asin && eanList && eanList.length > 0) {
          await upsertAsin(asin, eanList, costs);
        }

        if (!a_vrfd) {
          update['a_vrfd'] = {
            vrfd: false,
            vrfn_pending: true,
            flags: [],
            flag_cnt: 0,
          };
        }

        update = {
          ...update,
          ...(a_nm && typeof a_nm === 'string'
            ? { a_nm: replaceAllHiddenCharacters(a_nm) }
            : {}),
          info_prop: infoProp,
          aznUpdatedAt: new Date().toISOString(),
          infoUpdatedAt: new Date().toISOString(),
        };
        await handleProductUpdate(productId, infoProp, asin, update);
      }
      if (cause === 'incompleteInfo' || cause === 'missingSellerRank') {
        const infoProp = causeToInfoPropMap[cause];
        let { update } = generateMinimalUpdate(productInfo, product);
        update = {
          ...update,
          aznUpdatedAt: new Date().toISOString(),
          infoUpdatedAt: new Date().toISOString(),
        };
        update['a_orgn'] = 'a';
        update['a_pblsh'] = true;
        update['info_prop'] = infoProp;

        if (hasEan && update.asin && eanList && eanList.length > 0) {
          await upsertAsin(update.asin, eanList);
        }

        if (!a_vrfd) {
          update['a_vrfd'] = {
            vrfd: false,
            vrfn_pending: true,
            flags: [],
            flag_cnt: 0,
          };
        }
        await handleProductUpdate(productId, infoProp, update.asin, update);
      }
    } catch (error) {
      if (error instanceof Error) {
        let loggerMessage = '';
        if (error.message === 'Asin mismatch') {
          loggerMessage = `Asin mismatch: ${collection}-${productId.toString()}`;
          infos.missingProperties.infos++;
        }
        const result = await updateProductWithQuery(
          productId,
          lookupInfoStandardUpdate({ info_prop: 'missing' })
        );
        if (product.asin) {
          await handleOtherProducts(
            product.asin,
            lookupInfoStandardUpdate({ info_prop: 'missing' }),
            `Asin found: ${product.asin}`
          );
        }
        log(loggerMessage, result);
      }
    }
  } else {
    infos.missingProperties.infos++;
    const result = await updateProductWithQuery(
      productId,
      lookupInfoStandardUpdate({ info_prop: 'missing' })
    );
    if (product.asin) {
      await handleOtherProducts(
        product.asin,
        lookupInfoStandardUpdate({ info_prop: 'missing' }),
        `Asin found: ${product.asin}`
      );
    }
    log(`No infos: ${collection}-${productId.toString()}`, result);
  }
}

export async function handleLookupInfoNotFound(
  collection: string,
  productId: ObjectId,
  asin: string | undefined
) {
  const result = await updateProductWithQuery(
    productId,
    lookupInfoStandardUpdate({ info_prop: 'missing' })
  );

  if (asin) {
    await handleOtherProducts(
      asin,
      lookupInfoStandardUpdate({ info_prop: 'missing' }),
      `Asin found: ${asin}`
    );
  }
  log(`Not found: ${collection}-${productId.toString()}`, result);
}

export function priceToString(price: number) {
  return price.toString().replace('.', ',');
}
