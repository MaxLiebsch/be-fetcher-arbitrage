import match from "../services/match";
import crawl from "../services/crawl";
import scan from "../services/scan";
import crawlEan from "../services/crawlEan";
import lookupInfo from "../services/lookupInfo";
import wholesale from "../services/wholesale";
import queryEansOnEby from "../services/queryEansOnEby";
import lookupCategory from "../services/lookupCategory";
import { productPriceComperator } from "../services/dailySales";
import dealsOnEby from "../services/deals/daily/dealsOnEby";
import dealsOnAzn from "../services/deals/daily/dealsOnAzn";
import negEbyDeals from "../services/deals/weekly/negEbyDeals";
import negAznDeals from "../services/deals/weekly/negAznDeals";
import { TASK_TYPES } from "./taskTypes";
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
  WholeSaleTask,
} from "../types/tasks/Tasks";
import { MissingTaskError, TaskErrors } from "../errors";
import { TaskCompletedStatus } from "../status";
import { DailySalesTask } from "../types/tasks/DailySalesTask";

export async function executeTask(
  task: Tasks
): Promise<TaskCompletedStatus | TaskErrors> {
  const { type } = task;
  if (type === TASK_TYPES.CRAWL_SHOP) {
    return await crawl(task as ScrapeShopTask);
  }
  if (type === TASK_TYPES.DEALS_ON_EBY) {
    //@ts-ignore tody: fix this
    return await dealsOnEby(task as DealOnEbyTask);
  }
  if (type === TASK_TYPES.DEALS_ON_AZN) {
    return await dealsOnAzn(task as DealOnAznTask);
  }
  if (type === TASK_TYPES.DAILY_SALES) {
    return await productPriceComperator(task as DailySalesTask);
  }
  if (type === TASK_TYPES.WHOLESALE_SEARCH) {
    return await wholesale(task as WholeSaleTask);
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
}
