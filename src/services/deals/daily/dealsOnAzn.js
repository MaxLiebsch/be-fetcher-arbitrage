import { getShop } from "../../db/util/shops.js";
import { TaskCompletedStatus } from "../../../status.js";
import { QueryQueue } from "@dipmaxtech/clr-pkg";
import { proxyAuth } from "../../../constants.js";
import { differenceInHours } from "date-fns";
import { deleteArbispotterProduct } from "../../db/util/crudArbispotterProduct.js";
import { getProductLimit } from "../../../util/getProductLimit.js";
import { scrapeAznListings } from "../weekly/negAznDeals.js";
import { scrapeProductInfo } from "../../../util/deals/scrapeProductInfo.js";
import { updateProgressDealsOnAznTasks } from "../../../util/updateProgressInTasks.js";
import { lookForOutdatedDealsOnAzn } from "../../db/util/deals/daily/azn/lookForOutdatedDealsOnAzn.js";

const dealsOnAzn = async (task) => {
  const { productLimit } = task;
  const { _id, action, proxyType, concurrency } = task;
  return new Promise(async (res, rej) => {
    const { products: productsWithShop, shops } =
      await lookForOutdatedDealsOnAzn(_id, proxyType, action, productLimit);

    if (action === "recover") {
      console.log(
        "Recovery action",
        "Products:",
        productsWithShop.length,
        "Shops:",
        shops &&
          shops.length &&
          shops.reduce((acc, { shop }) => acc + " " + shop.d, "")
      );
    }

    const azn = await getShop("amazon.de");

    const infos = {
      total: 0,
      new: 0,
      old: 0,
      notFound: 0,
      locked: 0,
      scrapeProducts: {
        elapsedTime: "",
      },
      aznListings: {
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

    await updateProgressDealsOnAznTasks(proxyType);

    const queue = new QueryQueue(concurrency, proxyAuth, task);
    await queue.connect();

    await Promise.all(
      productsWithShop.map(async (productWithShop) => {
        const { shop: source, product } = productWithShop;
        const { d: shopDomain } = source;
        const { lnk: productLink, asin } = product;

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
              azn,
              source,
              aznLink,
              {
                ...product,
                ...isValidProduct,
              },
              infos,
              { timestamp: "dealAznUpdatedAt", taskIdProp: "dealAznTaskId" }
            );
          } else {
            infos.total++;
            await deleteArbispotterProduct(shopDomain, productLink);
            //DELETE PRODUCT
          }
        } else {
          await scrapeAznListings(queue, azn, source, aznLink, product, infos, {
            timestamp: "dealAznUpdatedAt",
            taskIdProp: "dealAznTaskId",
          });
        }
      })
    );
    await queue.clearQueue("DEALS_ON_AZN_COMPLETE", infos);
    res(
      new TaskCompletedStatus("DEALS_ON_AZN_COMPLETE", task, {
        infos,
        statistics: task.statistics,
      })
    );
  });
};

export default dealsOnAzn;
