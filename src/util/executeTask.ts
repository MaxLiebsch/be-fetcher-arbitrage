import match from "../services/match.js";
import scrapeShop from "../services/scrapeShop.js";
import scan from "../services/scan.js";
import crawlEan from "../services/crawlEan.js";
import lookupInfo from "../services/lookupInfo.js";
import wholesale from "../services/wholesale.js";
import queryEansOnEby from "../services/queryEansOnEby.js";
import lookupCategory from "../services/lookupCategory.js";
import { dailySales } from "../services/dailySales.js";
import dealsOnEby from "../services/deals/daily/dealsOnEby.js";
import dealsOnAzn from "../services/deals/daily/dealsOnAzn.js";
import negEbyDeals from "../services/deals/weekly/negEbyDeals.js";
import negAznDeals from "../services/deals/weekly/negAznDeals.js";
import { TASK_TYPES } from "./taskTypes.js";
import {
  DealOnAznTask,
  DealOnEbyTask,
  LookupCategoryTask,
  LookupInfoTask,
  MatchProductsTask,
  NegAznDealTask,
  NegEbyDealTask,
  QueryEansOnEbyTask,
  ScanTask,
  ScrapeEansTask,
  ScrapeShopTask,
  Tasks,
  WholeSaleEbyTask,
  WholeSaleTask,
} from "../types/tasks/Tasks.js";
import { MissingTaskError, TaskErrors } from "../errors.js";
import { TaskCompletedStatus } from "../status.js";
import { DailySalesTask } from "../types/tasks/DailySalesTask.js";
import { LocalLogger } from "@dipmaxtech/clr-pkg";
import { logGlobal, setTaskLogger } from "./logger.js";
import { wholeSaleEby } from "../services/wholesaleEbay.js";

export async function executeTask(
  task: Tasks
): Promise<TaskCompletedStatus | TaskErrors> {
  const { type } = task;
  const logger = new LocalLogger().createLogger(type);
  setTaskLogger(logger, "TASK_LOGGER"); // DEFAULT logger
  try {
    if (type === TASK_TYPES.CRAWL_SHOP) {
      return await scrapeShop(task as ScrapeShopTask);
    }
    if (type === TASK_TYPES.DEALS_ON_EBY) {
      return await dealsOnEby(task as DealOnEbyTask);
    }
    if (type === TASK_TYPES.DEALS_ON_AZN) {
      return await dealsOnAzn(task as DealOnAznTask);
    }
    if (type === TASK_TYPES.DAILY_SALES) {
      return await dailySales(task as DailySalesTask);
    }
    if (type === TASK_TYPES.WHOLESALE_SEARCH) {
      return await wholesale(task as WholeSaleTask);
    }
    if (type === TASK_TYPES.WHOLESALE_EBY_SEARCH) {
      return await wholeSaleEby(task as WholeSaleEbyTask);
    }
    if (type === TASK_TYPES.SCAN_SHOP) {
      return await scan(task as ScanTask);
    }
    if (type === TASK_TYPES.MATCH_PRODUCTS) {
      return await match(task as MatchProductsTask);
    }
    if (type === TASK_TYPES.NEG_AZN_DEALS) {
      return await negAznDeals(task as NegAznDealTask);
    }
    if (type === TASK_TYPES.NEG_EBY_DEALS) {
      return await negEbyDeals(task as NegEbyDealTask);
    }
    if (type === TASK_TYPES.CRAWL_EAN) {
      return await crawlEan(task as ScrapeEansTask);
    }
    if (type === TASK_TYPES.LOOKUP_INFO) {
      return await lookupInfo(task as LookupInfoTask);
    }
    if (type === TASK_TYPES.QUERY_EANS_EBY) {
      return await queryEansOnEby(task as QueryEansOnEbyTask);
    }
    if (type === TASK_TYPES.LOOKUP_CATEGORY) {
      return await lookupCategory(task as LookupCategoryTask);
    }
    throw MissingTaskError("", task);
  } finally {
    logGlobal(`Destroying logger for task ${type} after execution`);
    LocalLogger.instance.destroy(type);
    setTaskLogger(null, "TASK_LOGGER");
  }
}
