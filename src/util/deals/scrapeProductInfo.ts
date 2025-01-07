import {
  DbProductRecord,
  NotFoundCause,
  ProductRecord,
  queryProductPageQueue,
  QueryQueue,
  Shop,
  AddProductInfoProps,
  uuid,
  removeSearchParams,
} from '@dipmaxtech/clr-pkg';
import { handleDealsProductInfo } from './scrapeProductInfoHelper.js';
import { defaultQuery, MAX_RETRIES_SCRAPE_INFO } from '../../constants.js';
import { log } from '../logger.js';

export async function scrapeProductInfo(
  queue: QueryQueue,
  source: Shop,
  product: DbProductRecord
) {
  return new Promise<Partial<DbProductRecord> | null>((res, rej) => {
    let { lnk: productLink, s_hash, _id: productId } = product;
    productLink = removeSearchParams(productLink);
    const { d: shopDomain, proxyType } = source;
    const addProduct = async (product: ProductRecord) => {};
    const addProductInfo = async ({
      productInfo,
      url,
    }: AddProductInfoProps) => {
      res(
        await handleDealsProductInfo(
          shopDomain,
          { productInfo, url },
          product,
          source
        )
      );
    };
    const handleNotFound = async (cause: NotFoundCause) => {
      log(`Not found: ${source.d}-${productId} ${cause}`);
      res(null);
    };

    queue.pushTask(queryProductPageQueue, {
      retries: 0,
      shop: source,
      requestId: uuid(),
      s_hash,
      proxyType,
      addProduct,
      targetShop: {
        name: shopDomain,
        prefix: '',
        d: shopDomain,
      },
      onNotFound: handleNotFound,
      retriesOnFail: MAX_RETRIES_SCRAPE_INFO,
      addProductInfo,
      queue: queue,
      query: defaultQuery,
      prio: 0,
      extendedLookUp: false,
      pageInfo: {
        link: productLink,
        name: shopDomain,
      },
    });
  });
}
