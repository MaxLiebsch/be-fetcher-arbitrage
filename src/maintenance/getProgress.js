import { getCrawlAznListingsProgress } from "../db/util/crawlAznListings/getCrawlAznListingsProgress.js";
import { getCrawlEanProgress } from "../db/util/crawlEan/getCrawlEanProgress.js";
import { getMissingEanShops } from "../db/util/crawlEan/getMissingEanShops.js";
import {
  countCompletedProductsForCrawlEbyListings,
  countPendingProductsForCrawlEbyListingsAggregationFn,
  countTotalProductsCrawlEbyListings,
  getCrawlEbyListingsProgressAggregation,
} from "../db/util/crawlEbyListings/getCrawlEbyListingsProgressAggregation.js";
import { findArbispotterProducts } from "../db/util/crudArbispotterProduct.js";
import { getDealsOnAznProgress } from "../db/util/deals/daily/azn/getDealsOnAznProgress.js";
import { getOutdatedDealsOnAznShops } from "../db/util/deals/daily/azn/getOutdatedDealsOnAznShops.js";
import { lookForOutdatedDealsOnAzn } from "../db/util/deals/daily/azn/lookForOutdatedDealsOnAzn.js";
import { getMissingEbyCategoryShops } from "../db/util/lookupCategory/getMissingEbyCategoryShops.js";
import { getUnmatchedEanShops } from "../db/util/lookupInfo/getUnmatchedEanShops.js";
import {
  countPendingProductsForMatch,
  getMatchProgress,
} from "../db/util/match/getMatchProgress.js";
import { lockProductsForMatch } from "../db/util/match/lockProductsForMatch.js";
import {
  findTasksQuery,
  lockProductsForCrawlEbyListingsAggregation,
  lockProductsForMatchQuery,
  recoveryDealsOnAznQuery,
} from "../db/util/queries.js";
import { getQueryEansOnEbyProgress } from "../db/util/queryEansOnEby/getQueryEansOnEbyProgress.js";
import { getUnmatchedQueryEansOnEbyShops } from "../db/util/queryEansOnEby/getUnmatchedQueryEansOnEbyShops.js";
import {
  countPendingProductsUpdateProductinfo,
  countTotalProductsForUpdateProductinfo,
  getUpdateProductinfoProgress,
} from "../db/util/updateProductinfo/getUpdateProductInfoProgress.js";
import {
  updateProgressDealsOnAznTasks,
  updateProgressDealsOnEbyTasks,
  updateProgressDealTasks,
  updateProgressInCrawlEanTask,
  updateProgressInLookupCategoryTask,
  updateProgressInQueryEansOnEbyTask,
  updateProgressNegDealTasks,
} from "../util/updateProgressInTasks.js";

const main = async () => {
  // const { pendingShops: a } = await lockProductsForCrawlEbyListingsAggregation()
  // const { pendingShops: a }  = await getUnmatchedQueryEansOnEbyShops()
  // const { pendingShops: a } = await updateProgressDealsOnEbyTasks("mix");
  const { pendingShops: b } = await updateProgressDealsOnAznTasks("mix");

  const { pendingShops: a } =await getOutdatedDealsOnAznShops('mix')
  await updateProgressNegDealTasks("mix");
  await updateProgressInCrawlEanTask("mix");
  await updateProgressInLookupCategoryTask()
  await updateProgressInQueryEansOnEbyTask()
  console.log(a.reduce((acc, { shop }) => acc + " " + shop.d, ""));
  // const { products, shops } = await lookForOutdatedDealsOnAzn(
  //   "test",
  //   "mix",
  //   '',
  //   30
  // );

  // const product = products.find((p) => p.shop.d === "sales");

  // console.log('product: with sales', JSON.stringify(product, null,2))
  // console.log("No. products ", products.length);
  // console.log('products', products);
  // const a = await getUnmatchedQueryEansOnEbyShops();
  // console.log('a:', a)
  // const a = await getOutdatedDealsOnAznShops('mix')
  // console.log('result:', result)
  // const b = await getOutdatedNegMarginEbyListingsPerShop('mix')
  // console.log('b:', b)
  // await updateProgressInCrawlEanTask('mix');

  // const b  = findTasksQuery()
  // console.log('b:', JSON.stringify(b,null,2))
};

main().then((r) => process.exit(0));
