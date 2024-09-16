
import { getOutdatedDealsOnAznShops } from "../db/util/deals/daily/azn/getOutdatedDealsOnAznShops";
import {
  updateProgressDealsOnAznTasks,
  updateProgressInCrawlEanTask,
  updateProgressInLookupCategoryTask,
  updateProgressInQueryEansOnEbyTask,
  updateProgressNegDealTasks,
} from "../util/updateProgressInTasks";

const main = async () => {
  const b = await updateProgressDealsOnAznTasks("mix");
  console.log('b:', b)

  const { pendingShops: a } =await getOutdatedDealsOnAznShops('mix')
  await updateProgressNegDealTasks("mix");
  await updateProgressInCrawlEanTask("mix");
  await updateProgressInLookupCategoryTask()
  await updateProgressInQueryEansOnEbyTask()
  console.log(a.reduce((acc, { shop }) => acc + " " + shop.d, ""));
};

main().then((r) => process.exit(0));
