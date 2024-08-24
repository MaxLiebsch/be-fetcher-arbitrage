import { queryProductPageQueue } from "@dipmaxtech/clr-pkg";
import { handleDealsProductInfo } from "./scrapeProductInfoHelper.js";
import { defaultQuery, MAX_RETRIES_SCRAPE_EAN } from "../../constants.js";

export async function scrapeProductInfo(queue, source, product) {
  return new Promise((res, rej) => {
    const { lnk: productLink } = product;
    const { d: shopDomain } = source;
    const addProduct = async (product) => {};
    const addProductInfo = async ({ productInfo, url }) => {
      res(
        await handleDealsProductInfo(shopDomain, { productInfo, url }, product)
      );
    };
    const handleNotFound = async (cause) => {
      res(null);
    };

    queue.pushTask(queryProductPageQueue, {
      retries: 0,
      shop: source,
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
