import { getCrawlAznListingsProgress } from "../services/db/util/crawlAznListings/getCrawlAznListingsProgress.js";
import { getCrawlEanProgress } from "../services/db/util/crawlEan/getCrawlEanProgress.js";
import { getMissingEanShops } from "../services/db/util/crawlEan/getMissingEanShops.js";
import {
  countCompletedProductsForCrawlEbyListings,
  countPendingProductsForCrawlEbyListingsAggregationFn,
  countTotalProductsCrawlEbyListings,
  getCrawlEbyListingsProgressAggregation,
} from "../services/db/util/crawlEbyListings/getCrawlEbyListingsProgressAggregation.js";
import { getOutdatedDealsOnAznShops } from "../services/db/util/deals/daily/azn/getOutdatedDealsOnAznShops.js";
import { lookForOutdatedDealsOnAzn } from "../services/db/util/deals/daily/azn/lookForOutdatedDealsOnAzn.js";
import { getMissingEbyCategoryShops } from "../services/db/util/lookupCategory/getMissingEbyCategoryShops.js";
import { getUnmatchedEanShops } from "../services/db/util/lookupInfo/getUnmatchedEanShops.js";
import {
  countPendingProductsForMatch,
  getMatchProgress,
} from "../services/db/util/match/getMatchProgress.js";
import { lockProductsForMatch } from "../services/db/util/match/lockProductsForMatch.js";
import { lockProductsForMatchQuery } from "../services/db/util/queries.js";
import { getUnmatchedQueryEansOnEbyShops } from "../services/db/util/queryEansOnEby/getUnmatchedQueryEansOnEbyShops.js";
import {
  countPendingProductsUpdateProductinfo,
  countTotalProductsForUpdateProductinfo,
  getUpdateProductinfoProgress,
} from "../services/db/util/updateProductinfo/getUpdateProductInfoProgress.js";
import {
  updateProgressDealsOnAznTasks,
  updateProgressDealTasks,
  updateProgressInCrawlEanTask,
  updateProgressNegDealTasks,
} from "../util/updateProgressInTasks.js";

const main = async () => {
  // const result = await getRecoveryDealsOnAzn('66c76dee5c74f136b98af654', 'mix', 1000).then((r) => console.log('r:', r));
  // console.log('result:', result)
  // const b = await getOutdatedNegMarginEbyListingsPerShop('mix')
  // console.log('b:', b)
  // await updateProgressInCrawlEanTask('mix');
};

main().then((r) => process.exit(0));
