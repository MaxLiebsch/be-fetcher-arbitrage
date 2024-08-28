import { getShop } from "../../db/util/shops.js";
import { TaskCompletedStatus } from "../../../status.js";
import { queryProductPageQueue, QueryQueue } from "@dipmaxtech/clr-pkg";
import {
  defaultAznDealTask,
  defaultQuery,
  proxyAuth,
} from "../../../constants.js";
import { differenceInHours } from "date-fns";
import { deleteArbispotterProduct } from "../../db/util/crudArbispotterProduct.js";
import { getProductLimit } from "../../../util/getProductLimit.js";
import {
  handleAznListingNotFound,
  handleAznListingProductInfo,
} from "../../../util/scrapeAznListingsHelper.js";
import { scrapeProductInfo } from "../../../util/deals/scrapeProductInfo.js";
import { updateProgressNegDealAznTasks } from "../../../util/updateProgressInTasks.js";
import { lookForOutdatedNegMarginAznListings } from "../../db/util/deals/weekly/azn/lookForOutdatedNegMarginAznListings.js";

const negAznDeals = async (task) => {
  const { productLimit } = task;
  const { _id, action, concurrency, proxyType } = task;
  return new Promise(async (res, rej) => {
    const { products, shops } = await lookForOutdatedNegMarginAznListings(
      _id,
      proxyType,
      action,
      productLimit
    );
    const ebay = await getShop("amazon.de");

    const infos = {
      total: 0,
      notFound: 0,
      locked: 0,
      old: 0,
      new: 0,
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

    await updateProgressNegDealAznTasks(proxyType);

    const queue = new QueryQueue(concurrency, proxyAuth, task);
    await queue.connect();

    await Promise.all(
      products.map(async (productShop) => {
        const { product, shop: source } = productShop;
        const { d: shopDomain } = source;
        const { asin, lnk: productLink } = product;
        const diffHours = differenceInHours(
          new Date(),
          new Date(product.availUpdatedAt || product.updatedAt)
        );
        const aznLink =
          "https://www.amazon.de/dp/product/" + asin + "?language=de_DE";

        if (diffHours > 24) {
          const isValidProduct = await scrapeProductInfo(
            queue,
            source,
            product
          );
          if (isValidProduct) {
            await scrapeAznListings(
              queue,
              ebay,
              source,
              aznLink,
              {
                ...product,
                ...isValidProduct,
              },
              infos
            );
          } else {
            infos.total++;
            await deleteArbispotterProduct(shopDomain, productLink);
          }
        } else {
          await scrapeAznListings(queue, ebay, source, aznLink, product, infos);
        }
      })
    );
    await queue.clearQueue("CRAWL_AZN_LISTINGS_COMPLETE", infos);
    res(
      new TaskCompletedStatus("CRAWL_AZN_LISTINGS_COMPLETE", task, {
        infos,
        statistics: task.statistics,
      })
    );
  });
};

export default negAznDeals;

export async function scrapeAznListings(
  queue,
  target,
  source,
  targetLink,
  product,
  infos,
  processProps = defaultAznDealTask
) {
  return new Promise((res, rej) => {
    const { d } = target;
    const { d: shopDomain } = source;
    const { lnk: productLink } = product;
    const addProduct = async (product) => {};
    const addProductInfo = async ({ productInfo, url }) => {
      await handleAznListingProductInfo(
        shopDomain,
        product,
        { productInfo, url },
        infos,
        queue,
        processProps
      );
      res("done");
    };
    const handleNotFound = async () => {
      infos.notFound++;
      infos.total++;
      queue.total++;
      await handleAznListingNotFound(shopDomain, productLink);
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
