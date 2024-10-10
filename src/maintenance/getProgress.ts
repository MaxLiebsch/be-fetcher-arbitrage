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
  // await updateProgressDealsOnAznTasks();
  // await updateProgressDealsOnEbyTasks();
  // await updateProgressNegDealTasks();
  // await updateProgressInCrawlEanTask();
  // await updateProgressInLookupCategoryTask();
  // await updateProgressInQueryEansOnEbyTask();
  // await updateProgressInLookupInfoTask();
  const { pendingShops, shops } = await findPendingShops("LOOKUP_INFO");
  console.log(
    "pendingShops:",
    pendingShops.map((s) => s.shop.d + ": " + s.pending)
  );
  // console.log('shops:', shops.map(s => s.d))
  // console.log('pendingShops:', pendingShops)
  // const shop = await getShop("digitalo.de");
  // if (!shop) return
  // const r = await getTaskProgress(shop.d, "LOOKUP_INFO", shop.hasEan);
  // console.log('r:', r)
};

main().then((r) => process.exit(0));
