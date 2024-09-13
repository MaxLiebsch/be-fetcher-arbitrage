import { findShops } from "../db/util/shops";
import { createArbispotterCollection, salesDbName } from "../db/mongo";
import { crawlProducts } from "./productPriceComperator/crawlProducts";
import { crawlEans } from "./productPriceComperator/crawlEan";
import { lookupInfo } from "./productPriceComperator/lookupInfo";
import { queryEansOnEby } from "./productPriceComperator/queryEansOnEby";
import { lookupCategory } from "./productPriceComperator/lookupCategory";
import { crawlEbyListings } from "./productPriceComperator/crawlEbyListings";
import { findArbispotterProductsNoLimit } from "../db/util/crudArbispotterProduct";
import { TaskCompletedStatus } from "../status";
import {
  COMPLETE_FAILURE_THRESHOLD,
  MAX_TASK_RETRIES,
  SAVEGUARD_INCREASE_PAGE_LIMIT_RUNAWAY_THRESHOLD,
} from "../constants";
import calculatePageLimit from "../util/calculatePageLimit";
import { updateTask } from "../db/util/tasks";
import { LoggerService, QueueStats } from "@dipmaxtech/clr-pkg";
import { scrapeAznListings } from "./productPriceComperator/scrapeAznListings";
import { getElapsedTime } from "../util/dates";
import { MissingShopError } from "../errors";
import {
  DailySalesProgress,
  DailySalesTask,
} from "../types/tasks/DailySalesTask";
import { DailySalesStats } from "../types/taskStats/DailySalesStats";
import { combineQueueStats } from "../util/combineQueueStats";
import { TaskReturnType } from "../types/TaskReturnType";

const logService = LoggerService.getSingleton();

interface AllQueueStats {
  [key: string]: QueueStats;
}

export const productPriceComperator = async (
  task: DailySalesTask
): TaskReturnType => {
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

    if (!shops) {
      return rej(new MissingShopError(`No shop found for ${shopDomain}`, task));
    }
    const sellerCentral = shops["sellercentral.amazon.de"];
    const ebay = shops["ebay.de"];
    const origin = shops[shopDomain];
    const amazon = shops["amazon.de"];

    const infos: DailySalesStats = {
      total: 0,
      locked: 0,
      crawlProducts: {
        elapsedTime: "",
      },
      crawlEan: {
        elapsedTime: "",
      },
      lookupInfo: {
        elapsedTime: "",
      },
      lookupCategory: {
        elapsedTime: "",
      },
      queryEansOnEby: {
        elapsedTime: "",
      },
      aznListings: {
        elapsedTime: "",
      },
      ebyListings: {
        elapsedTime: "",
      },
      notFound: 0,
      elapsedTime: "",
    };

    let queueStats: AllQueueStats = {};

    await createArbispotterCollection("sales");

    if (
      task.action === "recover" &&
      Object.keys(task.progress).some(
        (key) => task.progress[key as keyof DailySalesProgress].length > 0
      )
    ) {
      infos["total"] = task.productLimit;
    } else {
      let done = false;
      let retry = 1;
      while (!done) {
        Object.keys(task.progress).forEach(
          (key) => (task.progress[key as keyof DailySalesProgress] = [])
        );
        console.log("Task CrawlProducts... ", retry, " try.");
        const crawledProductsInfo = await crawlProducts(origin, task);
        infos["crawlProducts"] = crawledProductsInfo.infos;
        infos["total"] = crawledProductsInfo.infos.total;
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
          queueStats.crawlProducts = crawledProductsInfo.queueStats;
          break;
        }
        if (infos.total > 1) {
          retry++;
        } else if (infos.total === 1 && retry < MAX_TASK_RETRIES) {
          retry++;
        } else if (infos.total === 1 && retry === MAX_TASK_RETRIES) {
          return res(
            new TaskCompletedStatus("DAILY_DEALS FAILED", task, {
              taskStats: infos,
              queueStats: crawledProductsInfo.queueStats,
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
        infos["crawlEan"] = crawlEansInfo.infos;
        queueStats.crawlEan = crawlEansInfo.queueStats;
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
        infos["lookupInfo"] = lookupInfos.infos;
        queueStats.lookupInfo = lookupInfos.queueStats;
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
        infos["queryEansOnEby"] = queryEansOnEbyInfo.infos;
        queueStats.queryEansOnEby = queryEansOnEbyInfo.queueStats;
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
        infos["lookupCategory"] = lookupCategoryInfo.infos;
        queueStats.lookupCategory = lookupCategoryInfo.queueStats;
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
        infos["aznListings"] = crawlAznListingsInfo.infos;
        queueStats.aznListings = crawlAznListingsInfo.queueStats;
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
        infos["ebyListings"] = crawlEbyListingsInfo.infos;
        queueStats.ebyListings = crawlEbyListingsInfo.queueStats;
      }
    }
    infos.ebyListings["elapsedTime"] =
      getElapsedTime(stepStartTime).elapsedTimeStr;

    const { elapsedTime, elapsedTimeStr } = getElapsedTime(processStartTime);

    infos.elapsedTime = elapsedTimeStr;

    logService.logger.info({
      shopDomain: task.shopDomain,
      taskid: task.id ?? "",
      type: task.type,
      infos,
      statistics: task.browserConfig,
      elapsedTime: elapsedTimeStr,
    });
    const combinedStats = combineQueueStats(Object.values(queueStats));
    res(
      new TaskCompletedStatus("DAILY_DEALS COMPLETED", task, {
        taskStats: infos,
        queueStats: combinedStats,
      })
    );
  });
};
