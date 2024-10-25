import {
  QueryQueue,
  queryURLBuilder,
  Shop,
  Query,
  DbProductRecord,
  uuid,
  queryEansOnEbyQueue,
  Product,
  Content,
  NotFoundCause,
  RETRY_LIMIT_MATCH_PRODUCTS,
  transformProduct,
  parseEsinFromUrl,
  replaceAllHiddenCharacters,
  roundToTwoDecimals,
  createHash,
} from '@dipmaxtech/clr-pkg';
import { updateProductWithQuery } from '../../db/util/crudProducts.js';
import { log } from '../logger.js';
import { findBestMatchFromProducts } from './findBestMatch.js';

interface QueryEbyParams {
  queue: QueryQueue;
  query: Query;
  shopDomain: string;
  eby: Shop;
  infos: any;
  product: DbProductRecord;
}

export default async function queryEby({
  queue,
  query,
  eby,
  infos,
  shopDomain,
  product,
}: QueryEbyParams) {
  return new Promise(async (resolve, reject) => {
    const { queryUrlSchema, proxyType, d: toolInfoDomain } = eby;

    if (!queryUrlSchema) {
      return reject();
    }
    const queryLink = queryURLBuilder(queryUrlSchema, query).url;

    const { _id: productId, s_hash, e_qty } = product;

    const foundProducts: Product[] = [];

    const addProduct = async (
      product: Partial<Record<Content, string | number | boolean | string[]>>,
    ) => {
      foundProducts.push(product as Product);
    };
    const isFinished = async () => {
      infos.total++;
      queue.total++;
      if (foundProducts.length === 0) {
        const result = await updateProductWithQuery(productId, {
          $set: {
            eby_prop: 'missing',
          },
          $unset: {
            eby_taskId: '',
          },
        });
        log(
          `No products found: ${shopDomain}-${productId} in ${toolInfoDomain}`,
          result,
        );
        infos.notFound++;
        resolve('done-azn');
        return;
      }
      const bestMatch = findBestMatchFromProducts({
        products: foundProducts,
        product,
      });
      if (bestMatch) {
        const transformedProduct = transformProduct(bestMatch, toolInfoDomain);
        const { lnk, nm, prc } = transformedProduct;
        let productUpdate: Partial<DbProductRecord> = {};

        const esin = parseEsinFromUrl(lnk);
        if (esin) {
          productUpdate['e_nm'] = replaceAllHiddenCharacters(nm);
          productUpdate['e_qty'] = e_qty || 1;
          productUpdate['e_uprc'] = roundToTwoDecimals(
            prc / productUpdate['e_qty'],
          );
          productUpdate['e_prc'] = prc;
          productUpdate['e_lnk'] = lnk!.split('?')[0];
          productUpdate['e_hash'] = createHash(productUpdate['e_lnk']);
          productUpdate['esin'] = esin;
          productUpdate['eby_prop'] = 'complete';

          const result = await updateProductWithQuery(productId, {
            $set: { ...productUpdate, matchedAt: new Date().toISOString() },
            $unset: {
              eby_taskId: '',
            },
          });
          log(
            `Matched ${shopDomain}-${productId} for ${toolInfoDomain} `,
            result,
          );
        } else {
          const result = await updateProductWithQuery(productId, {
            $set: {
              eby_prop: 'missing',
            },
            $unset: {
              eby_taskId: '',
            },
          });
          log(
            `Esin missing: ${shopDomain}-${productId} in ${toolInfoDomain}`,
            result,
          );
        }
      } else {
        const result = await updateProductWithQuery(productId, {
          $set: {
            eby_prop: 'missing',
          },
          $unset: {
            eby_taskId: '',
          },
        });
        log(
          `No match: ${shopDomain}-${productId} in ${toolInfoDomain}`,
          result,
        );
      }
      resolve('done-eby');
    };
    const handleNotFound = async (cause: NotFoundCause) => {
      const result = await updateProductWithQuery(productId, {
        $set: {
          eby_prop: 'missing',
        },
        $unset: {
          eby_taskId: '',
        },
      });
      log(`NotFound: ${shopDomain}-${productId} in ${toolInfoDomain}`, result);
      infos.notFound++;
      infos.total++;
      queue.total++;
      resolve('done-eby');
    };

    queue.pushTask(queryEansOnEbyQueue, {
      retries: 0,
      requestId: uuid(),
      s_hash,
      proxyType,
      shop: eby,
      targetShop: {
        prefix: '',
        d: shopDomain,
        name: shopDomain,
      },
      retriesOnFail: RETRY_LIMIT_MATCH_PRODUCTS,
      addProduct,
      isFinished,
      onNotFound: handleNotFound,
      queue,
      query,
      prio: 0,
      extendedLookUp: false,
      limit: undefined,
      pageInfo: {
        link: queryLink,
        name: shopDomain,
      },
    });
  });
}
