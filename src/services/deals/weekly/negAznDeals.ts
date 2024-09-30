import {
  AddProductInfoProps,
  DbProduct,
  DbProductRecord,
  NotFoundCause,
  ProductRecord,
  queryProductPageQueue,
  QueryQueue,
  Shop,
  ShopObject,
  uuid,
} from "@dipmaxtech/clr-pkg";
import { differenceInHours } from "date-fns";
import { getShop } from "../../../db/util/shops.js";
import { TaskCompletedStatus } from "../../../status.js";
import {
  defaultAznDealTask,
  defaultQuery,
  proxyAuth,
} from "../../../constants.js";
import {
  deleteArbispotterProduct,
  updateArbispotterProductQuery,
} from "../../../db/util/crudArbispotterProduct.js";
import { getProductLimitMulti } from "../../../util/getProductLimit.js";
import {
  handleAznListingNotFound,
  handleAznListingProductInfo,
} from "../../../util/scrapeAznListingsHelper.js";
import { scrapeProductInfo } from "../../../util/deals/scrapeProductInfo.js";
import { updateProgressNegDealAznTasks } from "../../../util/updateProgressInTasks.js";
import { NegAznDealTask } from "../../../types/tasks/Tasks.js";
import { NegDealsOnAznStats } from "../../../types/taskStats/NegDealsOnAzn.js";
import { MissingShopError, TaskErrors } from "../../../errors.js";
import { TaskStats } from "../../../types/taskStats/TasksStats.js";
import { TaskReturnType } from "../../../types/TaskReturnType.js";
import { log } from "../../../util/logger.js";
import { countRemainingProducts } from "../../../util/countRemainingProducts.js";
import { findPendingProductsForTask } from "../../../db/util/multiShopUtilities/findPendingProductsForTask.js";

const negAznDeals = async (task: NegAznDealTask): TaskReturnType => {
  const { productLimit } = task;
  const { _id: taskId, action, concurrency, proxyType, type } = task;
  return new Promise<TaskCompletedStatus | TaskErrors>(async (res, rej) => {
    const { products, shops } = await findPendingProductsForTask(
      "NEG_AZN_DEALS",
      taskId,
      action || "none",
      productLimit,
      proxyType
    );

    if (action === "recover") {
      log(`Recovering ${type} and found ${products.length} products`);
    } else {
      log(`Starting ${type} with ${products.length} products`);
    }

    const azn = await getShop("amazon.de");

    if (!azn) {
      return rej(new MissingShopError("amazon.de", task));
    }

    const infos: NegDealsOnAznStats = {
      total: 0,
      notFound: 0,
      locked: 0,
      scrapeProducts: {
        elapsedTime: "",
      },
      ebyListings: {
        elapsedTime: "",
      },
      missingProperties: {
        price: 0,
        infos: 0,
        aznCostNeg: 0,
      },
      elapsedTime: "",
    };

    const _productLimit = getProductLimitMulti(products.length, productLimit);
    log(`Product limit: ${_productLimit}`);
    task.actualProductLimit = _productLimit;
    infos.locked = products.length;

    await updateProgressNegDealAznTasks(proxyType);

    const queue = new QueryQueue(concurrency, proxyAuth, task);
    await queue.connect();

    await Promise.all(
      products.map(async (productShop) => {
        const { product, shop } = productShop;
        const source = shop as Shop;
        const { d: shopDomain } = source;
        const { asin, _id: productId } = product;
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
              infos
            );
          } else {
            infos.total++;
            log(`Deleted: ${shopDomain}-${productId}`);
            await deleteArbispotterProduct(shopDomain, productId);
          }
        } else {
          await scrapeAznListings(queue, azn, source, aznLink, product, infos);
        }
      })
    );
    const remaining = await countRemainingProducts(shops, taskId, type);
    log(`Remaining products: ${remaining}`);
    await queue.clearQueue("CRAWL_AZN_LISTINGS_COMPLETE", infos);
    res(
      new TaskCompletedStatus("CRAWL_AZN_LISTINGS_COMPLETE", task, {
        taskStats: infos,
        queueStats: queue.queueStats,
      })
    );
  });
};

export default negAznDeals;

export async function scrapeAznListings(
  queue: QueryQueue,
  target: Shop,
  source: Shop,
  targetLink: string,
  product: DbProductRecord,
  infos: TaskStats,
  processProps = defaultAznDealTask
) {
  return new Promise((res, rej) => {
    const { taskIdProp } = processProps;
    const { d } = target;
    const { d: shopDomain } = source;
    const { _id, s_hash } = product;
    const addProduct = async (product: ProductRecord) => {};
    const addProductInfo = async ({
      productInfo,
      url,
    }: AddProductInfoProps) => {
      await handleAznListingProductInfo(
        shopDomain,
        product,
        { productInfo, url },
        infos as NegDealsOnAznStats,
        queue,
        processProps
      );
      res("done");
    };
    const handleNotFound = async (cause: NotFoundCause) => {
      infos.notFound++;
      infos.total++;
      queue.total++;
      if (cause === "exceedsLimit") {
        const result = await updateArbispotterProductQuery(shopDomain, _id, {
          $unset: {
            [taskIdProp]: "",
          },
        });
        log(`ExceedsLimit: ${shopDomain}-${_id}`, result);
      } else {
        await handleAznListingNotFound(shopDomain, _id);
      }
      res("done");
    };

    queue.pushTask(queryProductPageQueue, {
      retries: 0,
      shop: target,
      s_hash,
      requestId: uuid(),
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
