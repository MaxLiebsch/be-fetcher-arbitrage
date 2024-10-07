import { DbProductRecord, QueryQueue, Shop } from "@dipmaxtech/clr-pkg";
import { differenceInHours } from "date-fns";
import { getShop } from "../../../db/util/shops.js";
import { TaskCompletedStatus } from "../../../status.js";
import { proxyAuth } from "../../../constants.js";
import { deleteProduct } from "../../../db/util/crudProducts.js";
import { getProductLimitMulti } from "../../../util/getProductLimit.js";
import { scrapeAznListings } from "../weekly/negAznDeals.js";
import { scrapeProductInfo } from "../../../util/deals/scrapeProductInfo.js";
import { updateProgressDealsOnAznTasks } from "../../../util/updateProgressInTasks.js";
import { DealsOnAznStats } from "../../../types/taskStats/DealsOnAznStats.js";
import { DealOnAznTask } from "../../../types/tasks/Tasks.js";
import { TaskReturnType } from "../../../types/TaskReturnType.js";
import { MissingShopError } from "../../../errors.js";
import { log } from "../../../util/logger.js";
import { countRemainingProducts } from "../../../util/countRemainingProducts.js";
import { findPendingProductsForTask } from "../../../db/util/multiShopUtilities/findPendingProductsForTask.js";

const dealsOnAzn = async (task: DealOnAznTask): TaskReturnType => {
  const { productLimit } = task;
  const { _id: taskId, action, proxyType, concurrency, type } = task;
  return new Promise(async (res, rej) => {
    const { products: productsWithShop, shops } =
      await findPendingProductsForTask(
        "DEALS_ON_AZN",
        taskId,
        action || "none",
        productLimit,
        proxyType
      );

    if (action === "recover") {
      log(`Recovering ${type} and found ${productsWithShop.length} products`);
    } else {
      log(`Starting ${type} with ${productsWithShop.length} products`);
    }

    const azn = await getShop("amazon.de");

    if (!azn) {
      return rej(new MissingShopError("amazon.de", task));
    }

    const infos: DealsOnAznStats = {
      total: 0,
      new: 0,
      old: 0,
      notFound: 0,
      elapsedTime: "",
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
        aznCostNeg: 0,
        infos: 0,
        calculationFailed: 0,
        name: 0,
        price: 0,
        link: 0,
        image: 0,
      },
    };

    const _productLimit = getProductLimitMulti(
      productsWithShop.length,
      productLimit
    );
    log("Product limit " + _productLimit);
    task.actualProductLimit = _productLimit;
    infos.locked = productsWithShop.length;

    await updateProgressDealsOnAznTasks(proxyType);

    const queue = new QueryQueue(concurrency, proxyAuth, task);
    await queue.connect();

    await Promise.all(
      productsWithShop.map(
        async (productWithShop: {
          shop: Pick<Shop, "d" | "hasEan" | "ean">;
          product: DbProductRecord;
        }) => {
          const { shop, product } = productWithShop;
          const source: Shop = shop as Shop;
          const { d: shopDomain } = source;
          const { _id: productId, asin } = product;

          const diffHours = differenceInHours(
            new Date(),
            new Date(product?.availUpdatedAt || product.updatedAt)
          );
          const aznLink =
            "https://www.amazon.de/dp/product/" + asin + "?language=de_DE";

          if (diffHours > 24) {
            const isValidProduct = await scrapeProductInfo(
              queue,
              source,
              product,
              proxyType
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
              await deleteProduct( productId);
              log(`Deleted: ${shopDomain}-${productId}`);
              //DELETE PRODUCT
            }
          } else {
            await scrapeAznListings(
              queue,
              azn,
              source,
              aznLink,
              product,
              infos,
              {
                timestamp: "dealAznUpdatedAt",
                taskIdProp: "dealAznTaskId",
              }
            );
          }
        }
      )
    );
    const remaining = await countRemainingProducts(shops, taskId, type);
    log(`Remaining products: ${remaining}`);
    await queue.clearQueue("DEALS_ON_AZN_COMPLETE", infos);
    res(
      new TaskCompletedStatus("DEALS_ON_AZN_COMPLETE", task, {
        taskStats: infos,
        queueStats: queue.queueStats,
      })
    );
  });
};

export default dealsOnAzn;
