import { getCrawlAznListingsProgress } from "../services/db/util/crawlAznListings/getCrawlAznListingsProgress.js";
import { getCrawlEanProgress } from "../services/db/util/crawlEan/getCrawlEanProgress.js";
import {
  countCompletedProductsForCrawlEbyListings,
  countPendingProductsForCrawlEbyListingsAggregationFn,
  countTotalProductsCrawlEbyListings,
  getCrawlEbyListingsProgressAggregation,
} from "../services/db/util/crawlEbyListings/getCrawlEbyListingsProgressAggregation.js";
import { getDealsOnAznProgress } from "../services/db/util/deals/azn/getDealsOnAznProgress.js";
import { getOutdatedDealsOnAznShops } from "../services/db/util/deals/azn/getOutdatedDealsOnAznShops.js";
import { getDealsOnEbyProgressAgg } from "../services/db/util/deals/eby/getDealsOnEbyListingsProgressAggregation.js";
import { getOutdatedDealsOnEbyShops } from "../services/db/util/deals/eby/getOutdatedDealsOnEbyShops.js";
import {
  countPendingProductsForMatch,
  getMatchProgress,
} from "../services/db/util/match/getMatchProgress.js";
import { lockProductsForMatch } from "../services/db/util/match/lockProductsForMatch.js";
import { lockProductsForMatchQuery } from "../services/db/util/queries.js";
import {
  countPendingProductsUpdateProductinfo,
  countTotalProductsForUpdateProductinfo,
  getUpdateProductinfoProgress,
} from "../services/db/util/updateProductinfo/getUpdateProductInfoProgress.js";

const main = async () => {
 
  const a = await getCrawlAznListingsProgress('alternate.de')
  console.log('a:', a)
 
};

main().then((r)=> process.exit(0));

