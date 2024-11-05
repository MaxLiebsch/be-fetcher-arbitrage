import {
  AddProductInfoProps,
  DbProductRecord,
  generateUpdate,
  generateMinimalUpdate,
  ObjectId,
  replaceAllHiddenCharacters,
  LookupInfoCause,
  LookupInfoPropType,
} from '@dipmaxtech/clr-pkg';
import { upsertAsin } from '../db/util/asinTable.js';
import { LookupInfoStats } from '../types/taskStats/LookupInfoStats.js';
import {
  updateProducts,
  updateProductWithQuery,
} from '../db/util/crudProducts.js';
import { log } from './logger.js';
import { lookupInfoStandardUpdate } from '../db/util/queries.js';

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

const handleUpdate = async (
  productId: ObjectId,
  collection: string,
  cause: string,
  asin: string | undefined,
  update: Partial<DbProductRecord>
) => {
  if (asin) {
    await handleOtherProducts(
      asin,
      {
        $set: {
          ...update,
        },
        $unset: { info_taskId: '' },
      },
      `Asin found: ${asin}`
    );
  }

  const result = await updateProductWithQuery(productId, {
    $set: {
      ...update,
    },
    $unset: { info_taskId: '' },
  });
  log(`Updated infos: ${collection}-${productId.toString()} ${cause}`, result);
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
        await handleUpdate(productId, collection, infoProp, asin, update);
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

        if (hasEan && update.asin &&  eanList && eanList.length > 0) {
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
        await handleUpdate(
          productId,
          collection,
          infoProp,
          update.asin,
          update
        );
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
