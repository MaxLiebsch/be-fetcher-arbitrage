
import { getCrawlEanProgress } from "../services/db/util/crawlEan/getCrawlEanProgress.js";
import { countPendingProductsForMatch, getMatchProgress } from "../services/db/util/match/getMatchProgress.js";
import { lockProductsForMatch } from "../services/db/util/match/lockProductsForMatch.js";
import { lockProductsForMatchQuery } from "../services/db/util/queries.js";
import { updateProgressInQueryEansOnEbyTask } from "../util/updateProgressInTasks.js";

const main = async () => {
  
  const p = await updateProgressInQueryEansOnEbyTask();
  console.log('p:', p); 
};

main().then((r)=> process.exit(0));
