import { ObjectId } from "@dipmaxtech/clr-pkg";
import { getOutdatedDealsOnAznShops } from "../db/util/deals/daily/azn/getOutdatedDealsOnAznShops";
import {
  countPendingProductsForWholesaleSearch,
  getWholesaleSearchProgress,
} from "../db/util/wholesaleSearch/getWholesaleProgress";
import {
  updateProgressDealsOnAznTasks,
  updateProgressInCrawlEanTask,
  updateProgressInLookupCategoryTask,
  updateProgressInQueryEansOnEbyTask,
  updateProgressNegDealTasks,
} from "../util/updateProgressInTasks";

const main = async () => {
  const c = await countPendingProductsForWholesaleSearch(
    new ObjectId("66f1593f30ce1653482a472e"),
    "WHOLESALE_EBY_SEARCH"
  );
  console.log("c:", c);
  // const b = await updateProgressDealsOnAznTasks("mix");
  // console.log('b:', b)

  // const { pendingShops: a } =await getOutdatedDealsOnAznShops('mix')
  // await updateProgressNegDealTasks("mix");
  // await updateProgressInCrawlEanTask("mix");
  // await updateProgressInLookupCategoryTask()
  // await updateProgressInQueryEansOnEbyTask()
  // console.log(a.reduce((acc, { shop }) => acc + " " + shop.d, ""));
};

main().then((r) => process.exit(0));
