import {
  DbProductRecord,
  NotFoundCause,
  ProductRecord,
  queryProductPageQueue,
  QueryQueue,
  Shop,
  AddProductInfoProps,
  uuid,
} from "@dipmaxtech/clr-pkg";
import { handleDealsProductInfo } from "./scrapeProductInfoHelper.js";
import { defaultQuery, MAX_RETRIES_SCRAPE_EAN } from "../../constants";
import { removeSearchParams } from "../removeSearch";

export async function scrapeProductInfo(
  queue: QueryQueue,
  source: Shop,
  product: DbProductRecord
) {
  return new Promise((res, rej) => {
    let { lnk: productLink, s_hash } = product;
    productLink = removeSearchParams(productLink);
    const { d: shopDomain } = source;
    const addProduct = async (product: ProductRecord) => {};
    const addProductInfo = async ({
      productInfo,
      url,
    }: AddProductInfoProps) => {
      res(
        await handleDealsProductInfo(shopDomain, { productInfo, url }, product)
      );
    };
    const handleNotFound = async (cause: NotFoundCause) => {
      res(null);
    };

    queue.pushTask(queryProductPageQueue, {
      retries: 0,
      shop: source,
      requestId: uuid(),
      s_hash,
      addProduct,
      targetShop: {
        name: shopDomain,
        prefix: "",
        d: shopDomain,
      },
      onNotFound: handleNotFound,
      retriesOnFail: MAX_RETRIES_SCRAPE_EAN,
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
