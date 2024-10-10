import { findPendingShops } from "../db/util/multiShopUtilities/findPendingShops.js";
import { getTaskProgress } from "../db/util/multiShopUtilities/getTaskProgress.js";
import { getShop } from "../db/util/shops.js";
import {
  updateProgressDealsOnAznTasks,
  updateProgressDealsOnEbyTasks,
  updateProgressInCrawlEanTask,
  updateProgressInLookupCategoryTask,
  updateProgressInLookupInfoTask,
  updateProgressInQueryEansOnEbyTask,
  updateProgressNegDealTasks,
} from "../util/updateProgressInTasks.js";

const main = async () => {
  await updateProgressDealsOnAznTasks();
  await updateProgressDealsOnEbyTasks();
  await updateProgressNegDealTasks();
  await updateProgressInCrawlEanTask();
  await updateProgressInLookupCategoryTask();
  await updateProgressInQueryEansOnEbyTask();
  await updateProgressInLookupInfoTask();
};

main().then((r) => process.exit(0));
