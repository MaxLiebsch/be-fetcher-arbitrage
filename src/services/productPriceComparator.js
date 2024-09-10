import { findShops } from "./db/util/shops.js";
import { createArbispotterCollection, salesDbName } from "./db/mongo.js";
import { crawlProducts } from "./productPriceComperator/crawlProducts.js";
import { crawlEans } from "./productPriceComperator/crawlEan.js";
import { lookupInfo } from "./productPriceComperator/lookupInfo.js";
import { queryEansOnEby } from "./productPriceComperator/queryEansOnEby.js";
import { lookupCategory } from "./productPriceComperator/lookupCategory.js";
import { crawlEbyListings } from "./productPriceComperator/crawlEbyListings.js";
import { findArbispotterProductsNoLimit } from "./db/util/crudArbispotterProduct.js";
import { TaskCompletedStatus } from "../status.js";
import {
  COMPLETE_FAILURE_THRESHOLD,
  MAX_TASK_RETRIES,
  SAVEGUARD_INCREASE_PAGE_LIMIT_RUNAWAY_THRESHOLD,
} from "../constants.js";
import calculatePageLimit from "../util/calculatePageLimit.js";
import { updateTask } from "./db/util/tasks.js";
import { LoggerService } from "@dipmaxtech/clr-pkg";
import { scrapeAznListings } from "./productPriceComperator/scrapeAznListings.js";
import { getElapsedTime } from "../util/dates.js";

const logService = LoggerService.getSingleton();

export const productPriceComperator = async (task) => {
  const processStartTime = Date.now();
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
    const amazon = shops["amazon.de"];

    const infos = {
      crawlProducts: {},
      crawlEan: {},
      lookupInfo: {},
      lookupCategory: {},
      queryEansOnEby: {},
      aznListings: {},
      ebyListings: {},
    };
    await createArbispotterCollection("sales");

    if (
      task.action === "recover" &&
      Object.keys(task.progress).some((key) => task.progress[key].length > 0)
    ) {
      infos["total"] = task.productLimit;
    } else {
      let done = false;
      let retry = 1;
      while (!done) {
        Object.keys(task.progress).forEach((key) => (task.progress[key] = []));
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
        }
        if (retry === MAX_TASK_RETRIES && infos.total > 1) {
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
        } else if (infos.total === 1 && retry < MAX_TASK_RETRIES) {
          retry++;
        } else if (infos.total === 1 && retry === MAX_TASK_RETRIES) {
          return res(
            new TaskCompletedStatus("DAILY_DEALS FAILED", task, {
              infos,
              statistics: {},
            })
          );
        }
      }
    }
    let stepStartTime = Date.now();
    if (task.progress.crawlEan.length > 0) {
      console.log(
        "Checking progress... ",
        "\nCRAWLEAN: ",
        task.progress.crawlEan.length,
        "\nQUERYEANSONEBY: ",
        task.progress.queryEansOnEby.length,
        "\nLOOKUPINFO: ",
        task.progress.lookupInfo.length,
        "\nLOOKUPCATEGORY: ",
        task.progress.lookupCategory.length,
        "\nAZNLISTINGS: ",
        task.progress.aznListings.length,
        "\nEBYLISTINGS: ",
        task.progress.ebyListings.length
      );
      console.log("Task CrawlEan ", task.progress.crawlEan.length);
      const products = await findArbispotterProductsNoLimit(salesDbName, {
        _id: { $in: task.progress.crawlEan },
      });
      if (products.length) {
        task.crawlEan = products;
        task.browserConfig.crawlEan.productLimit = products.length;
        const crawlEansInfo = await crawlEans(origin, task);
        infos["crawlEan"] = crawlEansInfo;
      }
    }
    infos.crawlEan["elapsedTime"] =
      getElapsedTime(stepStartTime).elapsedTimeStr;

    stepStartTime = Date.now();
    if (task.progress.lookupInfo.length > 0) {
      console.log(
        "Checking progress... ",
        "\nCRAWLEAN: ",
        task.progress.crawlEan.length,
        "\nQUERYEANSONEBY: ",
        task.progress.queryEansOnEby.length,
        "\nLOOKUPINFO: ",
        task.progress.lookupInfo.length,
        "\nLOOKUPCATEGORY: ",
        task.progress.lookupCategory.length,
        "\nAZNLISTINGS: ",
        task.progress.aznListings.length,
        "\nEBYLISTINGS: ",
        task.progress.ebyListings.length
      );
      console.log("Task LookupInfo ", task.progress.lookupInfo.length);
      const products = await findArbispotterProductsNoLimit(salesDbName, {
        _id: { $in: task.progress.lookupInfo },
      });
      if (products.length) {
        task.lookupInfo = products;
        task.browserConfig.lookupInfo.productLimit = products.length;
        const lookupInfos = await lookupInfo(sellerCentral, origin, task);
        infos["lookupInfo"] = lookupInfos;
      }
    }
    infos.lookupInfo["elapsedTime"] =
      getElapsedTime(stepStartTime).elapsedTimeStr;

    stepStartTime = Date.now();
    if (task.progress.queryEansOnEby.length > 0) {
      console.log(
        "Checking progress... ",
        "\nCRAWLEAN: ",
        task.progress.crawlEan.length,
        "\nQUERYEANSONEBY: ",
        task.progress.queryEansOnEby.length,
        "\nLOOKUPINFO: ",
        task.progress.lookupInfo.length,
        "\nLOOKUPCATEGORY: ",
        task.progress.lookupCategory.length,
        "\nAZNLISTINGS: ",
        task.progress.aznListings.length,
        "\nEBYLISTINGS: ",
        task.progress.ebyListings.length
      );
      console.log("Task QueryEansOnEby", task.progress.queryEansOnEby.length);
      const products = await findArbispotterProductsNoLimit(salesDbName, {
        _id: { $in: task.progress.queryEansOnEby },
      });
      if (products.length) {
        task.queryEansOnEby = products;
        task.browserConfig.queryEansOnEby.productLimit = products.length;
        const queryEansOnEbyInfo = await queryEansOnEby(ebay, task);
        infos["queryEansOnEby"] = queryEansOnEbyInfo;
      }
    }
    infos.queryEansOnEby["elapsedTime"] =
      getElapsedTime(stepStartTime).elapsedTimeStr;

    stepStartTime = Date.now();
    if (task.progress.lookupCategory.length > 0) {
      console.log(
        "Checking progress... ",
        "\nCRAWLEAN: ",
        task.progress.crawlEan.length,
        "\nQUERYEANSONEBY: ",
        task.progress.queryEansOnEby.length,
        "\nLOOKUPINFO: ",
        task.progress.lookupInfo.length,
        "\nLOOKUPCATEGORY: ",
        task.progress.lookupCategory.length,
        "\nAZNLISTINGS: ",
        task.progress.aznListings.length,
        "\nEBYLISTINGS: ",
        task.progress.ebyListings.length
      );
      console.log("Task LookupCategory ", task.progress.lookupCategory.length);
      const products = await findArbispotterProductsNoLimit(salesDbName, {
        _id: { $in: task.progress.lookupCategory },
      });
      if (products.length) {
        task.lookupCategory = products;
        task.browserConfig.lookupCategory.productLimit = products.length;
        const lookupCategoryInfo = await lookupCategory(ebay, origin, task);
        infos["lookupCategory"] = lookupCategoryInfo;
      }
    }
    infos.lookupCategory["elapsedTime"] =
      getElapsedTime(stepStartTime).elapsedTimeStr;

    if (task.progress.aznListings.length > 0) {
      console.log(
        "Checking progress... ",
        "\nCRAWLEAN: ",
        task.progress.crawlEan.length,
        "\nQUERYEANSONEBY: ",
        task.progress.queryEansOnEby.length,
        "\nLOOKUPINFO: ",
        task.progress.lookupInfo.length,
        "\nLOOKUPCATEGORY: ",
        task.progress.lookupCategory.length,
        "\nAZNLISTINGS: ",
        task.progress.aznListings.length,
        "\nEBYLISTINGS: ",
        task.progress.ebyListings.length
      );
      console.log("Task AznListings ", task.progress.aznListings.length);
      const products = await findArbispotterProductsNoLimit(salesDbName, {
        _id: { $in: task.progress.aznListings },
      });
      if (products.length) {
        task.aznListings = products;
        task.browserConfig.crawlAznListings.productLimit = products.length;
        const crawlAznListingsInfo = await scrapeAznListings(
          amazon,
          origin,
          task
        );
        infos["aznListings"] = crawlAznListingsInfo;
      }
    }
    infos.aznListings["elapsedTime"] =
      getElapsedTime(stepStartTime).elapsedTimeStr;

    if (task.progress.ebyListings.length > 0) {
      console.log(
        "Checking progress... ",
        "\nCRAWLEAN: ",
        task.progress.crawlEan.length,
        "\nQUERYEANSONEBY: ",
        task.progress.queryEansOnEby.length,
        "\nLOOKUPINFO: ",
        task.progress.lookupInfo.length,
        "\nLOOKUPCATEGORY: ",
        task.progress.lookupCategory.length,
        "\nAZNLISTINGS: ",
        task.progress.aznListings.length,
        "\nEBYLISTINGS: ",
        task.progress.ebyListings.length
      );
      console.log("Task EbyListings ", task.progress.ebyListings.length);
      const products = await findArbispotterProductsNoLimit(salesDbName, {
        _id: { $in: task.progress.ebyListings },
      });
      if (products.length) {
        task.ebyListings = products;
        task.browserConfig.crawlEbyListings.productLimit = products.length;
        const crawlEbyListingsInfo = await crawlEbyListings(ebay, task);
        infos["ebyListings"] = crawlEbyListingsInfo;
      }
    }
    infos.ebyListings["elapsedTime"] =
      getElapsedTime(stepStartTime).elapsedTimeStr;

    task.statistics = task.browserConfig;
    const { elapsedTime, elapsedTimeStr } = getElapsedTime(processStartTime);

    logService.logger.info({
      shopDomain: task.shopDomain,
      taskid: task.id ?? "",
      type: task.type,
      infos,
      statistics: task.statistics,
      elapsedTime: elapsedTimeStr,
    });
    res(
      new TaskCompletedStatus("DAILY_DEALS COMPLETED", task, {
        infos,
        statistics: task.statistics,
      })
    );
  });
};
