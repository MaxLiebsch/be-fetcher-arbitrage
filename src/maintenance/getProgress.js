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
import { getRecoveryDealsOnAzn } from "../services/db/util/deals/azn/lookForOutdatedDealsOnAzn.js";
import { getDealsOnEbyProgressAgg } from "../services/db/util/deals/eby/getDealsOnEbyListingsProgressAggregation.js";
import { getOutdatedDealsOnEbyShops } from "../services/db/util/deals/eby/getOutdatedDealsOnEbyShops.js";
import { getOutdatedNegMarginEbyListingsPerShop } from "../services/db/util/deals/eby/getOutdatedNegMarginEbyListingsPerShop.js";
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
import { updateProgressDealsOnAznTasks, updateProgressDealTasks, updateProgressNegDealTasks } from "../util/updateProgressInTasks.js";

const main = async () => {
  // const a = await getOutdatedNegMarginEbyListingsPerShop("mix")
  // const a = await getOutdatedDealsOnAznShops('mix')
  // console.log('a:', a.reduce((acc, val) => acc + `${val.shop.d}:${val.pending}\n`, ""));
  // const result = await getRecoveryDealsOnAzn('66c76dee5c74f136b98af654', 'mix', 1000).then((r) => console.log('r:', r));
  // console.log('result:', result)
  // const b = await getOutdatedNegMarginEbyListingsPerShop('mix')
  // console.log('b:', b)
  await updateProgressDealsOnAznTasks('mix')
};

main().then((r)=> process.exit(0));
