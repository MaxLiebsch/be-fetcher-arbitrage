import {
  globalEventEmitter,
  queryProductPageQueue,
  QueryQueue,
} from "@dipmaxtech/clr-pkg";
import {
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  defaultQuery,
  proxyAuth,
} from "../../constants.js";
import { salesDbName } from "../../services/productPriceComparator.js";
import {
  moveCrawledProduct,
  updateCrawlDataProduct,
} from "../../services/db/util/crudCrawlDataProduct.js";
import {
  moveArbispotterProduct,
  updateArbispotterProduct,
} from "../../services/db/util/crudArbispotterProduct.js";
import {
  handleCategoryAndUpdate,
  resetEbayProduct,
} from "../../services/lookupCategory.js";
import { updateTask } from "../../services/db/util/tasks.js";

export const lookupCategory = async (ebay, origin, task) =>
  new Promise(async (res, rej) => {
    const { browserConfig, _id, shopDomain } = task;
    const { concurrency, productLimit } = browserConfig.lookupCategory;
    let infos = {
      new: 0,
      total: 1,
      old: 0,
      notFound: 0,
      locked: 0,
      shops: {
        [shopDomain]: 0,
      },
    };

    task.actualProductLimit = task.lookupCategory.length;
    const queue = new QueryQueue(concurrency, proxyAuth, task);
    const eventEmitter = globalEventEmitter;

    eventEmitter.on(
      `${queue.queueId}-finished`,
      async function lookupCategoryCallback() {
        await updateTask(_id, { $set: { progress: task.progress } });
        await queue.disconnect(true);
        res(infos);
      }
    );

    const completedProducts = [];
    let interval = setInterval(async () => {
      await updateTask(_id, {
        $pull: {
          "progress.lookupCategory": { _id: { $in: completedProducts } },
        },
      });
    }, DEFAULT_CHECK_PROGRESS_INTERVAL);
    await queue.connect();
    while (task.progress.lookupCategory.length) {
      const crawlDataProduct = task.lookupCategory.pop();
      task.progress.lookupCategory.pop();
      if (!crawlDataProduct) continue;

      const crawledProductLink = crawlDataProduct.link;

      const queryUrl = "https://www.ebay.de/itm/" + crawlDataProduct.esin;

      const addProduct = async (product) => {};
      const addProductInfo = async ({ productInfo, url }) => {
        completedProducts.push(crawlDataProduct._id);
        infos.shops[shopDomain]++;
        infos.total++;
        queue.total++;
        if (productInfo) {
          const infoMap = new Map();
          productInfo.forEach((info) => infoMap.set(info.key, info.value));
          const crawlDataProductUpdate = {
            cat_locked: false,
            cat_prop: "complete",
            cat_taskId: "",
          };
          const ean = infoMap.get("ean");
          const ebyListingPrice = infoMap.get("e_prc");
          const categories = infoMap.get("categories");

          if (origin.hasEan || origin?.ean) {
            if (!ean) {
              await updateCrawlDataProduct(salesDbName, crawledProductLink, {
                cat_locked: false,
                cat_prop: "ean_missing",
                cat_taskId: "",
                esin: "",
              });
              await updateArbispotterProduct(
                salesDbName,
                crawledProductLink,
                resetEbayProduct
              );
            } else if (ean !== crawlDataProduct.ean) {
              await updateCrawlDataProduct(salesDbName, crawledProductLink, {
                cat_locked: false,
                cat_prop: "ean_missmatch",
                cat_taskId: "",
                esin: "",
                e_qty: 0,
              });
              await updateArbispotterProduct(
                salesDbName,
                crawledProductLink,
                resetEbayProduct
              );
            } else {
              await handleCategoryAndUpdate(
                salesDbName,
                crawledProductLink,
                crawlDataProduct,
                ebyListingPrice,
                categories,
                crawlDataProductUpdate
              );
            }
          } else {
            await handleCategoryAndUpdate(
              salesDbName,
              crawledProductLink,
              crawlDataProduct,
              ebyListingPrice,
              categories,
              crawlDataProductUpdate
            );
          }
        } else {
          await updateCrawlDataProduct(salesDbName, crawledProductLink, {
            cat_locked: false,
            cat_prop: "missing",
            cat_taskId: "",
            esin: "",
            e_qty: 0,
          });
        }
        if (infos.total === productLimit && !queue.idle()) {
          interval && clearInterval(interval);
          await updateTask(_id, { $set: { progress: task.progress } });
          await queue.disconnect(true);
          res(infos);
        }
      };
      const handleNotFound = async (cause) => {
        completedProducts.push(crawlDataProduct._id);
        infos.notFound++;
        infos.shops[shopDomain]++;
        infos.total++;
        queue.total++;
        if (cause === "timeout") {
          await updateCrawlDataProduct(salesDbName, crawledProductLink, {
            cat_locked: false,
            cat_prop: "timeout",
            cat_taskId: "",
          });
        } else {
          await moveCrawledProduct(salesDbName, "grave", crawledProductLink);
          await moveArbispotterProduct(
            salesDbName,
            "grave",
            crawledProductLink
          );
          if (infos.total === productLimit && !queue.idle()) {
            interval && clearInterval(interval);
            await updateTask(_id, { $set: { progress: task.progress } });
            await queue.disconnect(true);
            res(infos);
          }
        }
      };

      queue.pushTask(queryProductPageQueue, {
        retries: 0,
        shop: ebay,
        addProduct,
        targetShop: {
          name: shopDomain,
          d: shopDomain,
          prefix: "",
        },
        onNotFound: handleNotFound,
        addProductInfo,
        queue: queue,
        query: defaultQuery,
        prio: 0,
        extendedLookUp: false,
        limit: undefined,
        prodInfo: undefined,
        isFinished: undefined,
        pageInfo: {
          link: queryUrl,
          name: origin.d,
        },
      });
    }
  });
