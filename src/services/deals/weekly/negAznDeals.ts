import { getShop } from "../../../db/util/shops";
import { TaskCompletedStatus } from "../../../status";
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
import {
  defaultAznDealTask,
  defaultQuery,
  proxyAuth,
} from "../../../constants";
import { differenceInHours } from "date-fns";
import {
  deleteArbispotterProduct,
  updateArbispotterProductQuery,
} from "../../../db/util/crudArbispotterProduct";
import { getProductLimit } from "../../../util/getProductLimit";
import {
  handleAznListingNotFound,
  handleAznListingProductInfo,
} from "../../../util/scrapeAznListingsHelper";
import { scrapeProductInfo } from "../../../util/deals/scrapeProductInfo";
import { updateProgressNegDealAznTasks } from "../../../util/updateProgressInTasks";
import { lookForOutdatedNegMarginAznListings } from "../../../db/util/deals/weekly/azn/lookForOutdatedNegMarginAznListings";
import { NegAznDealTask } from "../../../types/tasks/Tasks";
import { NegDealsOnAznStats } from "../../../types/taskStats/NegDealsOnAzn";
import { MissingShopError, TaskErrors } from "../../../errors";
import { TaskStats } from "../../../types/taskStats/TasksStats";
import { TaskReturnType } from "../../../types/TaskReturnType";

const negAznDeals = async (task: NegAznDealTask):TaskReturnType => {
  const { productLimit } = task;
  const { _id, action, concurrency, proxyType } = task;
  return new Promise<TaskCompletedStatus | TaskErrors>(async (res, rej) => {
    const { products, shops } = await lookForOutdatedNegMarginAznListings(
      _id,
      proxyType,
      action || "none",
      productLimit
    );
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

    const _productLimit = getProductLimit(products.length, productLimit);
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
            await deleteArbispotterProduct(shopDomain, productLink);
          }
        } else {
          await scrapeAznListings(queue, azn, source, aznLink, product, infos);
        }
      })
    );
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
  target: ShopObject,
  source: ShopObject,
  targetLink: string,
  product: DbProductRecord,
  infos: TaskStats,
  processProps = defaultAznDealTask
) {
  return new Promise((res, rej) => {
    const { taskIdProp } = processProps;
    const { d } = target;
    const { d: shopDomain } = source;
    const { lnk: productLink, s_hash } = product;
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
      if (cause === "timeout") {
        await updateArbispotterProductQuery(shopDomain, productLink, {
          $unset: {
            [taskIdProp]: "",
          },
        });
      } else {
        await handleAznListingNotFound(shopDomain, productLink);
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
