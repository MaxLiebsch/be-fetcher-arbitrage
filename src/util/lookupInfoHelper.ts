import {
  AddProductInfoProps,
  DbProductRecord,
  generateUpdate,
  generateMinimalUpdate,
  ObjectId,
  replaceAllHiddenCharacters,
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
  const { ean, a_vrfd, _id: productId } = product;

  let infoProp: LookupInfoProps = 'complete';

  switch (cause) {
    case 'completeInfo':
      infoProp = 'complete';
      break;
    case 'missingSellerRank':
      infoProp = 'no_bsr';
      break;
    case 'incompleteInfo':
      infoProp = 'incomplete';
      break;
  }

  if (productInfo) {
    try {
      if (cause === 'completeInfo') {
        let update = generateUpdate(productInfo, product);

        const { costs, a_nm, asin } = update;

        update['a_orgn'] = 'a';
        update['a_pblsh'] = true;
        if (hasEan && asin) {
          await upsertAsin(asin, [ean], costs);
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
        let update: Partial<DbProductRecord> = generateMinimalUpdate(
          productInfo,
          product
        );
        update = {
          ...update,
          aznUpdatedAt: new Date().toISOString(),
          infoUpdatedAt: new Date().toISOString(),
        };
        update['a_orgn'] = 'a';
        update['a_pblsh'] = cause === 'incompleteInfo' ? false : true;
        update['info_prop'] = infoProp;

        if (hasEan && update.asin) {
          await upsertAsin(update.asin, [ean]);
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
        if (error.message === 'a_prc is 0') {
          loggerMessage = `Price 0: ${collection}-${productId.toString()}`;
          infos.missingProperties.price++;
        }
        if (error.message === 'costs.azn is 0') {
          loggerMessage = `Azn Costs 0: ${collection}-${productId.toString()}`;
          infos.missingProperties.costs++;
        }
        const result = await updateProductWithQuery(
          productId,
          lookupInfoStandardUpdate({ info_prop: 'incomplete' })
        );
        if (product.asin) {
          await handleOtherProducts(
            product.asin,
            lookupInfoStandardUpdate({ info_prop: 'incomplete' }),
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
