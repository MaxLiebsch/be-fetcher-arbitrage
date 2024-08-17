
import { getCrawlAznListingsProgress } from "../services/db/util/crawlAznListings/getCrawlAznListingsProgress.js";
import { getCrawlEanProgress } from "../services/db/util/crawlEan/getCrawlEanProgress.js";
import { countPendingProductsForMatch, getMatchProgress } from "../services/db/util/match/getMatchProgress.js";
import { lockProductsForMatch } from "../services/db/util/match/lockProductsForMatch.js";
import { lockProductsForMatchQuery } from "../services/db/util/queries.js";
import { updateProgressInQueryEansOnEbyTask } from "../util/updateProgressInTasks.js";

const main = async () => {
 
  const a = await getCrawlAznListingsProgress('alternate.de')
  console.log('a:', a)
 
};

main().then((r)=> process.exit(0));

