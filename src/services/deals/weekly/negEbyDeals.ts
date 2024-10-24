import {
  AddProductInfoProps,
  DbProductRecord,
  NotFoundCause,
  ProductRecord,
  queryProductPageQueue,
  QueryQueue,
  Shop,
  uuid,
} from "@dipmaxtech/clr-pkg";
import { differenceInHours } from "date-fns";
import { getShop } from "../../../db/util/shops.js";
import { TaskCompletedStatus } from "../../../status.js";
import {
  defaultEbyDealTask,
  defaultQuery,
  proxyAuth,
} from "../../../constants.js";
import {
  handleEbyListingNotFound,
  handleEbyListingProductInfo,
} from "../../../util/scrapeEbyListingsHelper.js";
import {
  deleteProduct,
  updateProductWithQuery,
} from "../../../db/util/crudProducts.js";
import { getProductLimitMulti } from "../../../util/getProductLimit.js";
import { scrapeProductInfo } from "../../../util/deals/scrapeProductInfo.js";
import { updateProgressNegDealEbyTasks } from "../../../util/updateProgressInTasks.js";
import { NegEbyDealTask } from "../../../types/tasks/Tasks.js";
import { TaskStats } from "../../../types/taskStats/TasksStats.js";
import { DealsOnEbyStats } from "../../../types/taskStats/DealsOnEbyStats.js";
import { NegDealsOnEbyStats } from "../../../types/taskStats/NegDealsOnEby.js";
import { MissingShopError } from "../../../errors.js";
import { TaskReturnType } from "../../../types/TaskReturnType.js";
import { log } from "../../../util/logger.js";
import { countRemainingProducts } from "../../../util/countRemainingProducts.js";
import { findPendingProductsWithAggForTask } from "../../../db/util/multiShopUtilities/findPendingProductsWithAggForTask.js";
import { scrapeEbyListings } from "../../../util/deals/scrapeEbyListings.js";

const negEbyDeals = async (task: NegEbyDealTask): TaskReturnType => {
  const { productLimit } = task;
  const { _id: taskId, action, concurrency, type } = task;
  return new Promise(async (res, rej) => {
    const { products, shops } = await findPendingProductsWithAggForTask(
      "NEG_EBY_DEALS",
      taskId,
      action || "none",
      productLimit
    );

    if (action === "recover") {
      log(`Recovering ${type} and found ${products.length} products`);
    } else {
      log(`Starting ${type} with ${products.length} products`);
    }

    const eby = await getShop("ebay.de");

    if (!eby) {
      return rej(new MissingShopError("ebay.de", task));
    }

    const infos: NegDealsOnEbyStats = {
      total: 0,
      notFound: 0,
      locked: 0,
      missingProperties: {
        mappedCat: 0,
        calculationFailed: 0,
        name: 0,
        price: 0,
        link: 0,
        image: 0,
      },
      elapsedTime: "",
    };

    const _productLimit = getProductLimitMulti(products.length, productLimit);
    log(`Product limit: ${_productLimit}`);
    infos.locked = products.length;
    await updateProgressNegDealEbyTasks();
    
    const queue = new QueryQueue(concurrency, proxyAuth, task);
    queue.actualProductLimit = _productLimit;
    await queue.connect();

    await Promise.all(
      products.map(async (productShop) => {
        const { product, shop } = productShop;
        const source: Shop = shop as Shop;
        const { d: shopDomain } = source;
        const { _id: productId, esin } = product;

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
            log(`Deleted: ${shopDomain}-${productId}`);
            await deleteProduct(productId);
            //DELETE PRODUCT
          }
        } else {
          await scrapeEbyListings(queue, eby, source, ebyLink, product, infos);
        }
      })
    );
    const remaining = await countRemainingProducts(shops, taskId, type);
    log(`Remaining products: ${remaining}`);
    await queue.clearQueue("CRAWL_EBY_LISTINGS_COMPLETE", infos);
    return res(
      new TaskCompletedStatus("CRAWL_EBY_LISTINGS_COMPLETE", task, {
        taskStats: infos,
        queueStats: queue.queueStats,
      })
    );
  });
};

export default negEbyDeals;

