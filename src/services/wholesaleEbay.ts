import { LoggerService, QueueStats } from "@dipmaxtech/clr-pkg";
import { findShops } from "../db/util/shops.js";
import { wholesaleCollectionName } from "../db/mongo.js";

import { queryEansOnEby } from "./dailySales/queryEansOnEby.js";
import { lookupCategory } from "./dailySales/lookupCategory.js";
import { findArbispotterProductsNoLimit } from "../db/util/crudArbispotterProduct.js";
import { TaskCompletedStatus } from "../status.js";

import { getElapsedTime } from "../util/dates.js";
import { MissingShopError } from "../errors.js";
import { combineQueueStats } from "../util/combineQueueStats.js";
import { TaskReturnType } from "../types/TaskReturnType.js";
import { log } from "../util/logger.js";
import { WholeSaleEbyStats } from "../types/taskStats/WholeSaleEbyStats.js";
import { WholeSaleEbyTask } from "../types/tasks/Tasks.js";
import { lockWholeSaleProducts } from "../db/util/wholesaleSearch/lockWholeSaleProducts.js";
import { updateWholesaleProgress } from "../util/updateProgressInTasks.js";
import { DEFAULT_CHECK_PROGRESS_INTERVAL } from "../constants.js";

const logService = LoggerService.getSingleton();

interface AllQueueStats {
  [key: string]: QueueStats;
}

export const wholeSaleEby = async (task: WholeSaleEbyTask): TaskReturnType => {
  const processStartTime = Date.now();
  const { productLimit, type, _id: taskId, id, progress, action } = task;

  return new Promise(async (res, rej) => {
    const shops = await findShops(["ebay.de"]);

    task["queryEansOnEby"] = [];
    task["lookupCategory"] = [];
    task["progress"]["queryEansOnEby"] = [];
    task["progress"]["lookupCategory"] = [];

    const products = await lockWholeSaleProducts(
      productLimit,
      taskId,
      action || "none",
      "WHOLESALE_EBY_SEARCH"
    );
    if (action === "recover") {
      log(`Recovering ${type}`);
    } else {
      log(`Starting ${type}`);
    }

    if (!shops) {
      return rej(new MissingShopError(`No shop found for ${type}`, task));
    }

    const ebay = shops["ebay.de"];

    const infos: WholeSaleEbyStats = {
      total: 0,
      locked: 0,
      lookupCategory: {
        elapsedTime: "",
      },
      queryEansOnEby: {
        elapsedTime: "",
      },
      notFound: 0,
      elapsedTime: "",
    };

    let queueStats: AllQueueStats = {};

    let stepStartTime = Date.now();

    const interval = setInterval(
      async () => await updateWholesaleProgress(taskId, "WHOLESALE_EBY_SEARCH"),
      DEFAULT_CHECK_PROGRESS_INTERVAL
    );

    /* QueryEansOnEby */
    if (products.length) {
      log(`WholeSale Eby: QueryEansOnEby ${products.length}`);
      task.queryEansOnEby = products;
      task.progress.queryEansOnEby = products.map((p) => p._id);
      task.browserConfig.queryEansOnEby.productLimit = products.length;
      const queryEansOnEbyInfo = await queryEansOnEby(
        wholesaleCollectionName,
        ebay,
        task
      );
      infos["queryEansOnEby"] = queryEansOnEbyInfo.infos;
      queueStats.queryEansOnEby = queryEansOnEbyInfo.queueStats;
    } else {
      log(`WholeSale Progress: No products found`);
    }

    infos.queryEansOnEby["elapsedTime"] =
      getElapsedTime(stepStartTime).elapsedTimeStr;

    stepStartTime = Date.now();

    /* LookupCategory */
    if (
      progress &&
      progress.lookupCategory &&
      progress.lookupCategory.length > 0
    ) {
      const products = await findArbispotterProductsNoLimit(
        wholesaleCollectionName,
        {
          _id: { $in: progress.lookupCategory },
        }
      );
      if (products.length) {
        log(`WholeSale Eby: LookupCategory ${products.length}`);
        task.lookupCategory = products;
        task.browserConfig.lookupCategory.productLimit = products.length;
        const lookupCategoryInfo = await lookupCategory(
          wholesaleCollectionName,
          ebay,
          { d: "wholeSaleEby", ean: "", hasEan: true },
          task
        );
        infos["lookupCategory"] = lookupCategoryInfo.infos;
        queueStats.lookupCategory = lookupCategoryInfo.queueStats;
      } else {
        log(
          `WholeSale Progress lookupCategory: No products found ${progress.lookupCategory.length}`
        );
      }
    } else {
      log(`WholeSale Eby: LookupCategory 0`);
    }

    infos.lookupCategory["elapsedTime"] =
      getElapsedTime(stepStartTime).elapsedTimeStr;

    const { elapsedTime, elapsedTimeStr } = getElapsedTime(processStartTime);

    infos.elapsedTime = elapsedTimeStr;

    logService.logger.info({
      shopDomain: "wholesale-eby",
      taskid: id ?? "",
      type,
      infos,
      statistics: task.browserConfig,
      elapsedTime: elapsedTimeStr,
    });
    const combinedStats = combineQueueStats(Object.values(queueStats));
    log(
      `Remaining: QUERYEANSONEBY ${
        progress && progress.queryEansOnEby ? progress.queryEansOnEby.length : 0
      } LOOKUPCATEGORY ${
        progress && progress.lookupCategory ? progress.lookupCategory.length : 0
      }`
    );
    clearInterval(interval);
    await updateWholesaleProgress(taskId, "WHOLESALE_EBY_SEARCH");
    res(
      new TaskCompletedStatus(`${type} COMPLETED`, task, {
        taskStats: infos,
        queueStats: combinedStats,
      })
    );
  });
};
