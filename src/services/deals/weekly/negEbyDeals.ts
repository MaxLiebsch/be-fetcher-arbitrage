import { getShop } from "../../../db/util/shops";
import { TaskCompletedStatus } from "../../../status";
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
import {
  defaultEbyDealTask,
  defaultQuery,
  proxyAuth,
} from "../../../constants";
import { differenceInHours } from "date-fns";
import {
  handleEbyListingNotFound,
  handleEbyListingProductInfo,
} from "../../../util/scrapeEbyListingsHelper";
import {
  deleteArbispotterProduct,
  updateArbispotterProductQuery,
} from "../../../db/util/crudArbispotterProduct";
import { getProductLimit } from "../../../util/getProductLimit";
import { scrapeProductInfo } from "../../../util/deals/scrapeProductInfo";
import { lookForOudatedNegMarginEbyListings } from "../../../db/util/deals/weekly/eby/lookForOutdatedNegMarginEbyListings";
import { updateProgressNegDealEbyTasks } from "../../../util/updateProgressInTasks";
import { NegEbyDealTask } from "../../../types/tasks/Tasks";
import { TaskStats } from "../../../types/taskStats/TasksStats";
import { DealsOnEbyStats } from "../../../types/taskStats/DealsOnEbyStats";
import { NegDealsOnEbyStats } from "../../../types/taskStats/NegDealsOnEby";
import { MissingShopError } from "../../../errors";
import { TaskReturnType } from "../../../types/TaskReturnType";

const negEbyDeals = async (task: NegEbyDealTask): TaskReturnType => {
  const { productLimit } = task;
  const { _id: taskId, action, concurrency, proxyType } = task;
  return new Promise(async (res, rej) => {
    const { products, shops } = await lookForOudatedNegMarginEbyListings(
      taskId,
      proxyType,
      action || "none",
      productLimit
    );
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

    const _productLimit = getProductLimit(products.length, productLimit);
    task.actualProductLimit = _productLimit;
    infos.locked = products.length;
    await updateProgressNegDealEbyTasks(proxyType);

    const queue = new QueryQueue(concurrency, proxyAuth, task);
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
            await deleteArbispotterProduct(shopDomain, productId);
            //DELETE PRODUCT
          }
        } else {
          await scrapeEbyListings(queue, eby, source, ebyLink, product, infos);
        }
      })
    );
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

export async function scrapeEbyListings(
  queue: QueryQueue,
  target: Shop,
  source: Shop,
  targetLink: string,
  product: DbProductRecord,
  infos: TaskStats,
  processProps = defaultEbyDealTask
) {
  return new Promise((res, rej) => {
    const { taskIdProp } = processProps;
    const { d } = target;
    const { d: shopDomain } = source;
    const { _id: productId, s_hash } = product;
    const addProduct = async (product: ProductRecord) => {};
    const addProductInfo = async ({
      productInfo,
      url,
    }: AddProductInfoProps) => {
      await handleEbyListingProductInfo(
        shopDomain,
        infos as DealsOnEbyStats,
        { productInfo, url },
        product,
        queue,
        processProps
      );
      res("done");
    };
    const handleNotFound = async (cause: NotFoundCause) => {
      infos.notFound++;
      infos.total++;
      queue.total++;
      if (cause === "timeout") {
        await updateArbispotterProductQuery(shopDomain, productId, {
          $unset: {
            [taskIdProp]: "",
          },
        });
      } else {
        await handleEbyListingNotFound(shopDomain, productId);
      }
      res("done");
    };

    queue.pushTask(queryProductPageQueue, {
      retries: 0,
      shop: target,
      addProduct,
      s_hash,
      requestId: uuid(),
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
