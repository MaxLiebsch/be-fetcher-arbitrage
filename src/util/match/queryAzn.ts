import {
  QueryQueue,
  queryURLBuilder,
  Shop,
  Query,
  DbProductRecord,
  uuid,
  Product,
  Content,
  NotFoundCause,
  queryShopQueue,
  RETRY_LIMIT_MATCH_PRODUCTS,
  transformProduct,
  parseAsinFromUrl,
  replaceAllHiddenCharacters,
  roundToTwoDecimals,
  createHash,
} from '@dipmaxtech/clr-pkg';
import { log } from '../logger.js';
import { updateProductWithQuery } from '../../db/util/crudProducts.js';
import { findBestMatchFromProducts } from './findBestMatch.js';

interface QueryAznParams {
  queue: QueryQueue;
  azn: Shop;
  infos: any;
  query: Query;
  shopDomain: string;
  product: DbProductRecord;
}

export default async function queryAzn({
  azn,
  queue,
  query,
  product,
  shopDomain,
  infos,
}: QueryAznParams) {
  return new Promise(async (resolve, reject) => {
    const { queryUrlSchema, proxyType, d: toolInfoDomain } = azn;

    if (!queryUrlSchema) {
      return reject(new Error(`No queryUrlSchema found for ${toolInfoDomain}`));
    }
    const queryLink = queryURLBuilder(queryUrlSchema, query).url;

    const { _id: productId, s_hash, a_qty } = product;

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
            azn_prop: 'missing',
          },
          $unset: {
            azn_taskId: '',
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
        const asin = parseAsinFromUrl(lnk);
        if (asin) {
          productUpdate['a_nm'] = replaceAllHiddenCharacters(nm);
          productUpdate['a_qty'] = a_qty || 1;
          productUpdate['a_uprc'] = roundToTwoDecimals(
            prc / productUpdate['a_qty'],
          );
          productUpdate['a_prc'] = prc;
          productUpdate['asin'] = asin;
          productUpdate['bsr'] = [];
          productUpdate['azn_prop'] = 'complete';
          const result = await updateProductWithQuery(productId, {
            $set: { ...productUpdate, matchedAt: new Date().toISOString() },
            $unset: {
              azn_taskId: '',
            },
          });
          log(
            `Matched ${shopDomain}-${productId} for ${toolInfoDomain} `,
            result,
          );
        } else {
          const result = await updateProductWithQuery(productId, {
            $set: {
              azn_prop: 'missing',
            },
            $unset: {
              azn_taskId: '',
            },
          });
          log(
            `asin missing: ${shopDomain}-${productId} in ${toolInfoDomain}`,
            result,
          );
        }
      } else {
        const result = await updateProductWithQuery(productId, {
          $set: {
            azn_prop: 'missing',
          },
          $unset: {
            azn_taskId: '',
          },
        });
        log(
          `No match: ${shopDomain}-${productId} in ${toolInfoDomain}`,
          result,
        );
      }
      
      resolve('done-azn');
    };

    const handleNotFound = async (cause: NotFoundCause) => {
      const result = await updateProductWithQuery(productId, {
        $set: {
          azn_prop: 'missing',
        },
        $unset: {
          azn_taskId: '',
        },
      });
      log(`NotFound: ${shopDomain}-${productId} in ${toolInfoDomain}`, result);
      infos.notFound++;
      infos.total++;
      queue.total++;
      resolve('done-azn');
    };

    queue.pushTask(queryShopQueue, {
      retries: 0,
      shop: azn,
      log,
      proxyType,
      requestId: uuid(),
      s_hash: s_hash as string,
      addProduct,
      retriesOnFail: RETRY_LIMIT_MATCH_PRODUCTS,
      onNotFound: handleNotFound,
      queue,
      query,
      prio: 0,
      isFinished,
      pageInfo: {
        link: queryLink,
        name: shopDomain,
      },
    });
  });
}
