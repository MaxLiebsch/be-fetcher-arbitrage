import { getShop } from "../../db/util/shops.js";
import { TaskCompletedStatus } from "../../../status.js";
import {
  LoggerService,
  queryProductPageQueue,
  QueryQueue,
} from "@dipmaxtech/clr-pkg";
import { lockProductsForCrawlEbyListings } from "../../db/util/crawlEbyListings/lockProductsForCrawlEbyListings.js";
import {
  defaultEbyDealTask,
  defaultQuery,
  MAX_RETRIES_SCRAPE_EAN,
  proxyAuth,
} from "../../../constants.js";
import { differenceInHours } from "date-fns";
import { handleDealsProductInfo } from "../../../util/deals/scrapeProductInfoHelper.js";
import {
  handleEbyListingNotFound,
  handleEbyListingProductInfo,
} from "../../../util/scrapeEbyListingsHelper.js";
import { deleteArbispotterProduct } from "../../db/util/crudArbispotterProduct.js";
import { getProductLimit } from "../../../util/getProductLimit.js";
import { scrapeProductInfo } from "../../../util/deals/scrapeProductInfo.js";

const negEbyDeals = async (task) => {
  const { productLimit } = task;
  const { _id, action, shopDomain, concurrency } = task;
  return new Promise(async (res, rej) => {
    const products = await lockProductsForCrawlEbyListings(
      shopDomain,
      productLimit,
      _id,
      action
    );
    const eby = await getShop("ebay.de");
    const source = await getShop(shopDomain);

    const infos = {
      total: 0,
      new: 0,
      old: 0,
      notFound: 0,
      locked: 0,
      scrapeProducts: {
        elapsedTime: "",
      },
      ebyListings: {
        elapsedTime: "",
      },
      missingProperties: {
        bsr: 0,
        mappedCat: 0,
        calculationFailed: 0,
        name: 0,
        price: 0,
        link: 0,
        image: 0,
      },
    };

    const _productLimit = getProductLimit(products.length, productLimit);
    task.actualProductLimit = _productLimit;

    infos.locked = products.length;

    const queue = new QueryQueue(concurrency, proxyAuth, task);
    await queue.connect();

    await Promise.all(
      products.map(async (product) => {
        const { lnk: productLink, esin, e_mrgn, e_mrgn_pct } = product;

        const diffHours = differenceInHours(
          new Date(),
          new Date(product.availUpdatedAt || product.updatedAt)
        );
        const ebyLink = "https://www.ebay.de/itm/" + esin;

        if (diffHours > 24) {
          const isValidProduct = await scrapeProductInfo(
            queue,
            source,
            product
          );
          if (isValidProduct) { 
            await scrapeEbyListings(
              queue,
              eby,
              source,
              ebyLink,
              {
                ...product,
                ...isValidProduct,
              },
              infos
            );
          } else {
            infos.total++;
            await deleteArbispotterProduct(shopDomain, productLink);
            //DELETE PRODUCT
          }
        } else {
          await scrapeEbyListings(queue, eby, source, ebyLink, product, infos);
        }
      })
    );
    await queue.clearQueue("CRAWL_EBY_LISTINGS_COMPLETE", infos);
    res(
      new TaskCompletedStatus("CRAWL_EBY_LISTINGS_COMPLETE", task, {
        infos,
        statistics: task.statistics,
      })
    );
  });
};

export default negEbyDeals;


export async function scrapeEbyListings(
  queue,
  target,
  source,
  targetLink,
  product,
  infos,
  processProps = defaultEbyDealTask
) {
  return new Promise((res, rej) => {
    const { d } = target;
    const { d: shopDomain } = source;
    const { lnk: productLink } = product;
    const addProduct = async (product) => {};
    const addProductInfo = async ({ productInfo, url }) => {
      await handleEbyListingProductInfo(
        shopDomain,
        infos,
        { productInfo, url },
        product,
        queue,
        processProps
      );
      res("done");
    };
    const handleNotFound = async () => {
      infos.notFound++;
      infos.total++;
      queue.total++;
      await handleEbyListingNotFound(shopDomain, productLink);
      res("done");
    };

    queue.pushTask(queryProductPageQueue, {
      retries: 0,
      shop: target,
      addProduct,
      onNotFound: handleNotFound,
      addProductInfo,
      queue,
      query: defaultQuery,
      prio: 0,
      extendedLookUp: false,
      pageInfo: {
        link: targetLink,
        name: d,
      },
    });
  });
}
