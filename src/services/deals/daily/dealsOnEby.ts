import { getShop } from "../../../db/util/shops";
import { TaskCompletedStatus } from "../../../status";
import { QueryQueue, Shop } from "@dipmaxtech/clr-pkg";
import { proxyAuth } from "../../../constants";
import { differenceInHours } from "date-fns";
import { deleteArbispotterProduct } from "../../../db/util/crudArbispotterProduct";
import { getProductLimitMulti } from "../../../util/getProductLimit";
import { scrapeEbyListings } from "../weekly/negEbyDeals";
import { scrapeProductInfo } from "../../../util/deals/scrapeProductInfo";
import { updateProgressDealsOnEbyTasks } from "../../../util/updateProgressInTasks";
import { lookForOutdatedDealsOnEby } from "../../../db/util/deals/daily/eby/lookForOutdatedDealsOnEby";
import { DealOnEbyTask } from "../../../types/tasks/Tasks";
import { DealsOnEbyStats } from "../../../types/taskStats/DealsOnEbyStats";
import { MissingShopError } from "../../../errors";
import { TaskReturnType } from "../../../types/TaskReturnType";
import { countRemainingProducts } from "../../../util/countRemainingProducts";
import { log } from "../../../util/logger";

const dealsOnEby = async (task: DealOnEbyTask): TaskReturnType => {
  const { productLimit } = task;
  const { _id: taskId, action, proxyType, concurrency, type } = task;
  return new Promise(async (res, rej) => {
    const { products: productsWithShop, shops } =
      await lookForOutdatedDealsOnEby(
        taskId,
        proxyType,
        action || "none",
        productLimit
      );

    if (action === "recover") {
      log(`Recovering ${type} and found ${productsWithShop.length} products`);
    } else {
      log(`Starting ${type} with ${productsWithShop.length} products`);
    }

    const eby = await getShop("ebay.de");

    if (!eby) {
      return rej(new MissingShopError("ebay.de", task));
    }

    const infos: DealsOnEbyStats = {
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
      elapsedTime: "",
    };

    const _productLimit = getProductLimitMulti(
      productsWithShop.length,
      productLimit
    );
    log("Product limit " + _productLimit);
    task.actualProductLimit = _productLimit;
    infos.locked = productsWithShop.length;

    await updateProgressDealsOnEbyTasks(proxyType);

    const queue = new QueryQueue(concurrency, proxyAuth, task);
    await queue.connect();

    await Promise.all(
      productsWithShop.map(async (productWithShop) => {
        const { shop, product } = productWithShop;
        const source: Shop = shop as Shop;
        const { d: shopDomain } = source;
        const { esin, _id: productId } = product;

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
            await deleteArbispotterProduct(shopDomain, productId);
            log(`Deleted: ${shopDomain}-${productId}`);
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
    const remaining = await countRemainingProducts(shops, taskId, type);
    log(`Remaining products: ${remaining}`);
    await queue.clearQueue("DEALS_ON_EBY_COMPLETE", infos);
    return res(
      new TaskCompletedStatus("DEALS_ON_EBY_COMPLETE", task, {
        taskStats: infos,
        queueStats: queue.queueStats || {},
      })
    );
  });
};

export default dealsOnEby;
