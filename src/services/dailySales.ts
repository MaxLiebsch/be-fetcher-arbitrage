import { LoggerService, QueueStats } from "@dipmaxtech/clr-pkg";
import { findShops } from "../db/util/shops.js";
import { scrapeProducts } from "./dailySales/scrapeProducts.js";
import { crawlEans } from "./dailySales/crawlEan.js";
import { lookupInfo } from "./dailySales/lookupInfo.js";
import { queryEansOnEby } from "./dailySales/queryEansOnEby.js";
import { lookupCategory } from "./dailySales/lookupCategory.js";
import { crawlEbyListings } from "./dailySales/crawlEbyListings.js";
import { findProductsNoLimit } from "../db/util/crudProducts.js";
import { TaskCompletedStatus } from "../status.js";
import {
  COMPLETE_FAILURE_THRESHOLD,
  MAX_TASK_RETRIES,
  MIN_DAILY_SALES,
  SAVEGUARD_INCREASE_PAGE_LIMIT_RUNAWAY_THRESHOLD,
} from "../constants.js";
import { scrapeAznListingsDailyDeals } from "./dailySales/scrapeAznListings.js";
import calculatePageLimit from "../util/calculatePageLimit.js";
import { updateTask } from "../db/util/tasks.js";
import { getElapsedTime } from "../util/dates.js";
import { MissingShopError } from "../errors.js";
import {
  DailySalesProgress,
  DailySalesTask,
} from "../types/tasks/DailySalesTask.js";
import { DailySalesStats } from "../types/taskStats/DailySalesStats.js";
import { combineQueueStats } from "../util/combineQueueStats.js";
import { TaskReturnType } from "../types/TaskReturnType.js";
import { log } from "../util/logger.js";

const logService = LoggerService.getSingleton();

interface AllQueueStats {
  [key: string]: QueueStats;
}

export const dailySales = async (task: DailySalesTask): TaskReturnType => {
  const processStartTime = Date.now();
  const {
    productLimit,
    shopDomain,
    type,
    progress,
    action,
    _id: taskId,
  } = task;

  return new Promise(async (res, rej) => {
    const shops = await findShops([
      shopDomain,
      "amazon.de",
      "sellercentral.amazon.de",
      "ebay.de",
    ]);

    if (action === "recover") {
      log(`Recovering ${type}`);
    } else {
      log(`Starting ${type}`);
    }

    updateTask(taskId, {
      $set: {
        lastTotal: 0,
      },
    });

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

    if (
      action === "recover" &&
      Object.keys(progress).some(
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
        log(`Task CrawlProducts... ${retry} try.`);
        const crawledProductsInfo = await scrapeProducts(origin, task);
        infos["crawlProducts"] = crawledProductsInfo.infos;
        infos["total"] = crawledProductsInfo.infos.total;
        const limit = task.browserConfig.crawlShop.limit;
        if (infos.total >= task.productLimit) {
          log(`Total products as expected: ${infos.total} ${retry} try.`);
          done = true;
          break;
        }
        log(`Total products as low as: ${infos.total} ${retry} try.`);
        if (
          retry < MAX_TASK_RETRIES &&
          infos.total > COMPLETE_FAILURE_THRESHOLD &&
          task.browserConfig.crawlShop.limit.pages <=
            SAVEGUARD_INCREASE_PAGE_LIMIT_RUNAWAY_THRESHOLD
        ) {
          log(`Increasing page limit... ${retry} try.`);
          const newPageLimit = calculatePageLimit(
            limit.pages,
            productLimit,
            infos.total
          );
          task.browserConfig.crawlShop.limit = {
            ...limit,
            pages: newPageLimit,
          };
          log(`New limit ${task.browserConfig.crawlShop.limit}`);
        }
        if (retry === MAX_TASK_RETRIES && infos.total > 1) {
          log(`Limit reached after ${retry} retries. Continuing....`);
          task.productLimit =
            infos.total < MIN_DAILY_SALES ? MIN_DAILY_SALES : infos.total;
          delete task.action;
          await updateTask(task._id, { $set: { ...task } });
          done = true;
          queueStats.crawlProducts = crawledProductsInfo.queueStats;
          break;
        }
        if (infos.total > 1) {
          retry++;
        } else if (infos.total === 0 && retry < MAX_TASK_RETRIES) {
          retry++;
        } else if (infos.total === 0 && retry === MAX_TASK_RETRIES) {
          log(`Total products 0 after ${retry} retries. Failed.`);
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

    /* CrawlEan */
    if (progress.crawlEan.length > 0) {
      log(`DailySales: CrawlEan ${progress.crawlEan.length}`);
      const products = await findProductsNoLimit({
        _id: { $in: task.progress.crawlEan },
      });
      if (products.length) {
        task.crawlEan = products;
        task.browserConfig.crawlEan.productLimit = products.length;
        const crawlEansInfo = await crawlEans(origin, task);
        infos["crawlEan"] = crawlEansInfo.infos;
        queueStats.crawlEan = crawlEansInfo.queueStats;
      } else {
        log(
          `DailySales Progress ${task.progress.crawlEan.length} but no products found`
        );
        await updateTask(taskId, {
          $set: {
            progress: {
              ...task.progress,
              crawlEan: [],
            },
          },
        })
      }
    } else {
      log(`DailySales: CrawlEan 0`);
    }
    infos.crawlEan["elapsedTime"] =
      getElapsedTime(stepStartTime).elapsedTimeStr;

    stepStartTime = Date.now();

    /* Lookup Info */

    if (progress.lookupInfo.length > 0) {
      const products = await findProductsNoLimit({
        _id: { $in: task.progress.lookupInfo },
      });
      if (products.length) {
        log(`DailySales: LookupInfo ${products.length}`);
        task.lookupInfo = products;
        task.browserConfig.lookupInfo.productLimit = products.length;
        const lookupInfos = await lookupInfo(sellerCentral, origin, task);
        infos["lookupInfo"] = lookupInfos.infos;
        queueStats.lookupInfo = lookupInfos.queueStats;
      } else {
        log(
          `DailySales Progress ${task.progress.lookupInfo.length} but no products found`
        );
        await updateTask(taskId, {
          $set: {
            progress: {
              ...task.progress,
              lookupInfo: [],
            },
          },
        })
      }
    } else {
      log(`DailySales: LookupInfo 0`);
    }
    infos.lookupInfo["elapsedTime"] =
      getElapsedTime(stepStartTime).elapsedTimeStr;

    stepStartTime = Date.now();

    /* QueryEansOnEby */
    if (task.progress.queryEansOnEby.length > 0) {
      const products = await findProductsNoLimit({
        _id: { $in: task.progress.queryEansOnEby },
      });
      if (products.length) {
        log(`DailySales: QueryEansOnEby ${products.length}`);
        task.queryEansOnEby = products;
        task.browserConfig.queryEansOnEby.productLimit = products.length;
        const queryEansOnEbyInfo = await queryEansOnEby(shopDomain, ebay, task);
        infos["queryEansOnEby"] = queryEansOnEbyInfo.infos;
        queueStats.queryEansOnEby = queryEansOnEbyInfo.queueStats;
      } else {
        log(
          `DailySales Progress ${task.progress.queryEansOnEby.length} but no products found`
        );
        await updateTask(taskId, {
          $set: {
            progress: {
              ...task.progress,
              queryEansOnEby: [],
            },
          },
        })
      }
    } else {
      log(`DailySales: QueryEansOnEby 0`);
    }
    infos.queryEansOnEby["elapsedTime"] =
      getElapsedTime(stepStartTime).elapsedTimeStr;

    stepStartTime = Date.now();

    /* LookupCategory */
    if (task.progress.lookupCategory.length > 0) {
      const products = await findProductsNoLimit({
        _id: { $in: task.progress.lookupCategory },
      });
      if (products.length) {
        log(`DailySales: LookupCategory ${products.length}`);
        task.lookupCategory = products;
        task.browserConfig.lookupCategory.productLimit = products.length;
        const lookupCategoryInfo = await lookupCategory(
          shopDomain,
          ebay,
          origin,
          task
        );
        infos["lookupCategory"] = lookupCategoryInfo.infos;
        queueStats.lookupCategory = lookupCategoryInfo.queueStats;
      } else {
        log(
          `DailySales Progress ${task.progress.lookupCategory.length} but no products found`
        );
        await updateTask(taskId, {
          $set: {
            progress: {
              ...task.progress,
              lookupCategory: [],
            },
          },
        })
      }
    } else {
      log(`DailySales: LookupCategory 0`);
    }

    infos.lookupCategory["elapsedTime"] =
      getElapsedTime(stepStartTime).elapsedTimeStr;

    /* AznListings */
    if (task.progress.aznListings.length > 0) {
      const products = await findProductsNoLimit({
        _id: { $in: task.progress.aznListings },
      });
      if (products.length) {
        log(`DailySales: AznListings ${products.length}`);
        task.aznListings = products;
        task.browserConfig.crawlAznListings.productLimit = products.length;
        const crawlAznListingsInfo = await scrapeAznListingsDailyDeals(
          amazon,
          origin,
          task
        );
        infos["aznListings"] = crawlAznListingsInfo.infos;
        queueStats.aznListings = crawlAznListingsInfo.queueStats;
      } else {
        log(
          `DailySales Progress ${task.progress.aznListings.length} but no products found`
        );
        await updateTask(taskId, {
          $set: {
            progress: {
              ...task.progress,
              aznListings: [],
            },
          },
        })
      }
    } else {
      log(`DailySales: AznListings 0`);
    }
    infos.aznListings["elapsedTime"] =
      getElapsedTime(stepStartTime).elapsedTimeStr;

    /* EbyListings */
    if (task.progress.ebyListings.length > 0) {
      const products = await findProductsNoLimit({
        _id: { $in: task.progress.ebyListings },
      });
      if (products.length) {
        log(`DailySales: EbyListings ${products.length}`);
        task.ebyListings = products;
        task.browserConfig.crawlEbyListings.productLimit = products.length;
        const crawlEbyListingsInfo = await crawlEbyListings(ebay, task);
        infos["ebyListings"] = crawlEbyListingsInfo.infos;
        queueStats.ebyListings = crawlEbyListingsInfo.queueStats;
      } else {
        log(
          `DailySales Progress ${task.progress.ebyListings.length} but no products found`
        );
        await updateTask(taskId, {
          $set: {
            progress: {
              ...task.progress,
              ebyListings: [],
            },
          },
        })
      }
    } else {
      log(`DailySales: EbyListings 0`);
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
    log(
      `Remaining: CRAWLEAN ${progress.crawlEan.length} QUERYEANSONEBY ${progress.queryEansOnEby.length} LOOKUPINFO ${progress.lookupInfo.length} LOOKUPCATEGORY ${progress.lookupCategory.length} AZNLISTINGS ${progress.aznListings.length} EBYLISTINGS ${progress.ebyListings.length} `
    );
    res(
      new TaskCompletedStatus("DAILY_DEALS COMPLETED", task, {
        taskStats: infos,
        queueStats: combinedStats,
      })
    );
  });
};
