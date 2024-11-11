import {
  AddProductInfoProps,
  DbProductRecord,
  generateUpdate,
  generateMinimalUpdate,
  ObjectId,
  replaceAllHiddenCharacters,
  LookupInfoCause,
  LookupInfoPropType,
  LookupInfoProps,
} from '@dipmaxtech/clr-pkg';
import { upsertAsin } from '../db/util/asinTable.js';
import { LookupInfoStats } from '../types/taskStats/LookupInfoStats.js';
import {
  updateProducts,
  updateProductWithQuery,
} from '../db/util/crudProducts.js';
import { log } from './logger.js';
import { lookupInfoStandardUpdate } from '../db/util/queries.js';
import { syncAznListings } from './syncAznListings.js';

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

const handleProductUpdate = async (
  productId: ObjectId,
  cause: string,
  asin: string | undefined,
  update: Partial<DbProductRecord>
) => {
  await syncAznListings(productId, asin, update);

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
  const { a_vrfd, _id: productId, eanList, a_prc, costs, a_mrgn } = product;

  const isComplete = a_mrgn && a_prc && costs?.azn;

  if (productInfo) {
    try {
      if (cause === 'completeInfo') {
        let { update, infoProp } = generateUpdate(productInfo, product);
        const info_prop = isComplete ? LookupInfoProps.complete : infoProp;

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

        let taskUpdatedProp = 'aznUpdatedAt';

        if (update.a_mrgn && update.a_mrgn > 0) {
          taskUpdatedProp = 'dealAznUpdatedAt';
        }

        update = {
          ...update,
          ...(a_nm && typeof a_nm === 'string'
            ? { a_nm: replaceAllHiddenCharacters(a_nm) }
            : {}),
          info_prop,
          [taskUpdatedProp]: new Date().toISOString(),
          infoUpdatedAt: new Date().toISOString(),
        };
        await handleProductUpdate(productId, cause, asin, update);
      }
      if (cause === 'incompleteInfo' || cause === 'missingSellerRank') {
        const info_prop = isComplete
          ? LookupInfoProps.complete
          : causeToInfoPropMap[cause];
        let { update } = generateMinimalUpdate(productInfo, product);

        let taskUpdatedProp = 'aznUpdatedAt';

        if (update.a_mrgn && update.a_mrgn > 0) {
          taskUpdatedProp = 'dealAznUpdatedAt';
        }
        update = {
          ...update,
          [taskUpdatedProp]: new Date().toISOString(),
          infoUpdatedAt: new Date().toISOString(),
        };
        update['a_orgn'] = 'a';
        update['a_pblsh'] = true;
        update['info_prop'] = info_prop;

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
        await handleProductUpdate(productId, info_prop, update.asin, update);
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
