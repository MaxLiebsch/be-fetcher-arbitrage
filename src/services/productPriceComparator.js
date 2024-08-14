import { findShops } from "./db/util/shops.js";
import {
  createArbispotterCollection,
  createCrawlDataCollection,
} from "./db/mongo.js";
import { crawlProducts } from "../util/productPriceComperator/crawlProducts.js";
import { crawlEans } from "../util/productPriceComperator/crawlEan.js";
import { lookupInfo } from "../util/productPriceComperator/lookupInfo.js";
import { queryEansOnEby } from "../util/productPriceComperator/queryEansOnEby.js";
import { lookupCategory } from "../util/productPriceComperator/lookupCategory.js";
import { crawlAznListings } from "../util/productPriceComperator/crawlAznListings.js";
import { crawlEbyListings } from "../util/productPriceComperator/crawlEbyListings.js";
import { findCrawlDataProductsNoLimit } from "./db/util/crudCrawlDataProduct.js";
import { TaskCompletedStatus } from "../status.js";
import {
  COMPLETE_FAILURE_THRESHOLD,
  MAX_TASK_RETRIES,
  SAVEGUARD_INCREASE_PAGE_LIMIT_RUNAWAY_THRESHOLD,
} from "../constants.js";
import calculatePageLimit from "../util/calculatePageLimit.js";
import { updateTask } from "./db/util/tasks.js";
import { LoggerService } from "@dipmaxtech/clr-pkg";

export const salesDbName = "sales";
const logService = LoggerService.getSingleton();

export const productPriceComperator = async (task) => {
  const startTime = Date.now();
  const { productLimit } = task;
  const { shopDomain } = task;
  return new Promise(async (res, rej) => {
    const shops = await findShops([
      shopDomain,
      "amazon.de",
      "sellercentral.amazon.de",
      "ebay.de",
    ]);
    const sellerCentral = shops["sellercentral.amazon.de"];
    const ebay = shops["ebay.de"];
    const origin = shops[shopDomain];

    const infos = {
      crawlProducts: {},
      crawlEan: {},
      lookupInfo: {},
      lookupCategory: {},
      queryEansOnEby: {},
      aznListings: {},
      ebyListings: {},
    };
    await createCrawlDataCollection("sales");
    await createArbispotterCollection("sales");

    if (task.action === "recover") {
      infos["total"] = task.productLimit;
    } else {
      let done = false;
      let retry = 1;
      while (!done) {
        console.log("Task CrawlProducts... ", retry, " try.");
        const crawledProductsInfo = await crawlProducts(origin, task);
        infos["crawlProducts"] = crawledProductsInfo;
        infos["total"] = crawledProductsInfo.total;
        const limit = task.browserConfig.crawlShop.limit;
        if (infos.total >= task.productLimit) {
          done = true;
          break;
        }
        console.log("Total products as low as: ", infos.total);
        if (
          retry < MAX_TASK_RETRIES &&
          infos.total > COMPLETE_FAILURE_THRESHOLD &&
          task.browserConfig.crawlShop.limit.pages <=
            SAVEGUARD_INCREASE_PAGE_LIMIT_RUNAWAY_THRESHOLD
        ) {
          console.log("Updating page limit...");
          const newPageLimit = calculatePageLimit(
            limit.pages,
            productLimit,
            infos.total
          );
          task.browserConfig.crawlShop.limit = {
            ...limit,
            pages: newPageLimit,
          };
          console.log("New limit", task.browserConfig.crawlShop.limit);
          console.log("crawlEan: ", task.progress.crawlEan.length);
        }
        if (retry >= MAX_TASK_RETRIES && infos.total > 1) {
          console.log(
            "Limit never reached after ",
            retry,
            " retries. Continuing...."
          );
          task.productLimit = infos.total;
          await updateTask(task._id, { $set: { ...task } });
          done = true;
          break;
        }
        if (infos.total > 1) {
          retry++;
          task.progress.crawlEan = [];
        }
      }
    }

    if (task.progress.crawlEan.length > 0) {
      console.log("Task CrawlEan ", task.progress.crawlEan.length);
      const products = await findCrawlDataProductsNoLimit(salesDbName, {
        _id: { $in: task.progress.crawlEan },
      });
      if (products.length) {
        task.crawlEan = products;
        task.browserConfig.crawlEan.productLimit = products.length;
        const crawlEansInfo = await crawlEans(origin, task);
        infos["crawlEan"] = crawlEansInfo;
      }
    }

    if (task.progress.lookupInfo.length > 0) {
      console.log("Task LookupInfo ", task.progress.lookupInfo.length);
      const products = await findCrawlDataProductsNoLimit(salesDbName, {
        _id: { $in: task.progress.lookupInfo },
      });
      if (products.length) {
        task.lookupInfo = products;
        task.browserConfig.lookupInfo.productLimit = products.length;
        const lookupInfos = await lookupInfo(sellerCentral, origin, task);
        infos["lookupInfo"] = lookupInfos;
      }
    }

    if (task.progress.queryEansOnEby.length > 0) {
      console.log("Task QueryEansOnEby", task.progress.queryEansOnEby.length);
      const products = await findCrawlDataProductsNoLimit(salesDbName, {
        _id: { $in: task.progress.queryEansOnEby },
      });
      if (products.length) {
        task.queryEansOnEby = products;
        task.browserConfig.queryEansOnEby.productLimit = products.length;
        const queryEansOnEbyInfo = await queryEansOnEby(ebay, task);
        infos["queryEansOnEby"] = queryEansOnEbyInfo;
      }
    }

    if (task.progress.lookupCategory.length > 0) {
      console.log("Task LookupCategory ", task.progress.lookupCategory.length);
      const products = await findCrawlDataProductsNoLimit(salesDbName, {
        _id: { $in: task.progress.lookupCategory },
      });
      if (products.length) {
        task.lookupCategory = products;
        task.browserConfig.lookupCategory.productLimit = products.length;
        const lookupCategoryInfo = await lookupCategory(ebay, origin, task);
        infos["lookupCategory"] = lookupCategoryInfo;
      }
    }

    if (task.progress.aznListings.length > 0) {
      console.log("Task AznListings ", task.progress.aznListings.length);
      const products = await findCrawlDataProductsNoLimit(salesDbName, {
        _id: { $in: task.progress.aznListings },
      });
      if (products.length) {
        task.aznListings = products;
        task.browserConfig.crawlAznListings.productLimit = products.length;
        const crawlAznListingsInfo = await crawlAznListings(
          sellerCentral,
          origin,
          task
        );
        infos["aznListings"] = crawlAznListingsInfo;
      }
    }

    if (task.progress.ebyListings.length > 0) {
      console.log("Task EbyListings ", task.progress.ebyListings.length);
      const products = await findCrawlDataProductsNoLimit(salesDbName, {
        _id: { $in: task.progress.ebyListings },
      });
      if (products.length) {
        task.ebyListings = products;
        task.browserConfig.crawlEbyListings.productLimit = products.length;
        const crawlEbyListingsInfo = await crawlEbyListings(ebay, task);
        infos["ebyListings"] = crawlEbyListingsInfo;
      }
    }
    task.statistics = task.browserConfig;
    const endTime = Date.now();
    const elapsedTime = (endTime - startTime) / 1000 / 60 / 60;
    
    logService.logger.info({
      shopDomain: task.shopDomain,
      taskid: task.id ?? "",
      type: task.type,
      ...infos,
      ...task.statistics,
      elapsedTime: `${elapsedTime.toFixed(2)} h`,
    });
    res(
      new TaskCompletedStatus("", task, {
        infos,
        statistics: task.statistics,
      })
    );
  });
};

// productPriceComperator(task).then((r) => {
//   console.log(JSON.stringify(r, null, 2));
//   console.log(
//     "Task completed ",
//     isTaskComplete(task.type, r.result.infos, task.productLimit)
//   );
// });
