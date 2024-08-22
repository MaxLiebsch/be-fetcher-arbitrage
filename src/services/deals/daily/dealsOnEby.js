import { getShop } from "../../db/util/shops.js";
import { TaskCompletedStatus } from "../../../status.js";
import { QueryQueue } from "@dipmaxtech/clr-pkg";
import { proxyAuth } from "../../../constants.js";
import { differenceInHours } from "date-fns";
import { deleteArbispotterProduct } from "../../db/util/crudArbispotterProduct.js";
import { getProductLimit } from "../../../util/getProductLimit.js";
import { scrapeEbyListings, scrapeProductInfo } from "../weekly/negEbyDeals.js";
import { lookForOutdatedDealsOnEby } from "../../db/util/deals/eby/lookForOutdatedDealsOnEby.js";

const dealsOnEby = async (task) => {
  const { productLimit } = task;
  const { _id, action, proxyType, concurrency } = task;
  return new Promise(async (res, rej) => {
    const { products: productsWithShop } = await lookForOutdatedDealsOnEby(
      _id,
      proxyType,
      productLimit,
      action
    );

    const eby = await getShop("ebay.de");

    const infos = {
      total: 0,
      notFound: 0,
      locked: 0,
      new: 0,
      old: 0,
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

    const _productLimit = getProductLimit(
      productsWithShop.length,
      productLimit
    );
    task.actualProductLimit = _productLimit;

    infos.locked = productsWithShop.length;

    const queue = new QueryQueue(concurrency, proxyAuth, task);
    await queue.connect();

    await Promise.all(
      productsWithShop.map(async (productWithShop) => {
        const { shop: source, product } = productWithShop;
        const { d: shopDomain } = source;
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
              infos,
              { timestamp: "dealEbyUpdatedAt", taskIdProp: "dealEbyTaskId" }
            );
          } else {
            infos.total++;
            await deleteArbispotterProduct(shopDomain, productLink);
            //DELETE PRODUCT
          }
        } else {
          await scrapeEbyListings(queue, eby, source, ebyLink, product, infos, {
            timestamp: "dealEbyUpdatedAt",
            taskIdProp: "dealEbyTaskId",
          });
        }
      })
    );
    await queue.clearQueue("DEALS_ON_EBY_COMPLETE", infos);
    res(
      new TaskCompletedStatus("DEALS_ON_EBY_COMPLETE", task, {
        infos,
        statistics: task.statistics || {},
      })
    );
  });
};

export default dealsOnEby;
