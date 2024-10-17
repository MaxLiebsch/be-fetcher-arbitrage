import { TaskTypes } from "@dipmaxtech/clr-pkg";
import {
  updateProgressDealsOnAznTasks,
  updateProgressDealsOnEbyTasks,
  updateProgressInCrawlEanTask,
  updateProgressInLookupCategoryTask,
  updateProgressInLookupInfoTask,
  updateProgressInQueryEansOnEbyTask,
  updateProgressNegDealTasks,
} from "../../util/updateProgressInTasks.js";

export const updateProgressFns: {
  [key in TaskTypes]: any;
} = {
  DEALS_ON_EBY: updateProgressDealsOnEbyTasks,
  DEALS_ON_AZN: updateProgressDealsOnAznTasks,
  DAILY_SALES: undefined,
  CRAWL_SHOP: undefined,
  WHOLESALE_SEARCH: undefined,
  WHOLESALE_EBY_SEARCH: undefined,
  SCAN_SHOP: undefined,
  MATCH_PRODUCTS: undefined,
  CRAWL_AZN_LISTINGS: updateProgressNegDealTasks,
  CRAWL_EBY_LISTINGS: updateProgressNegDealTasks,
  CRAWL_EAN: updateProgressInCrawlEanTask,
  LOOKUP_INFO: updateProgressInLookupInfoTask,
  QUERY_EANS_EBY: updateProgressInQueryEansOnEbyTask,
  LOOKUP_CATEGORY: updateProgressInLookupCategoryTask,
};

export async function updateAllTasksProgress() {
  await updateProgressDealsOnAznTasks();
  await updateProgressDealsOnEbyTasks();
  await updateProgressNegDealTasks();
  await updateProgressInCrawlEanTask();
  await updateProgressInLookupCategoryTask();
  await updateProgressInQueryEansOnEbyTask();
  await updateProgressInLookupInfoTask();
}
