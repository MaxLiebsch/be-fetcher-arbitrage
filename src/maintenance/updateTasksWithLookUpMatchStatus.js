import { updateTaskWithQuery } from "../../src/db/util/tasks.js";
import { getCrawlAznListingsProgress } from "../db/util/crawlAznListings/getCrawlAznListingsProgress.js";
import { getMatchProgress } from "../db/util/match/getMatchProgress.js";

const updateTasksWithLookUpMatchStatus = async () => {
  const shopDomains = [
    "idealo.de", //check
    "alternate.de", //check
    "bergfreunde.de",
    "mueller.de", //check
    "reichelt.de",
    "voelkner.de",
  ];
  await Promise.all(
    shopDomains.map(async (shopDomain) => {
      const progress = await getMatchProgress(shopDomain);
      const lookupProgress = await getCrawlAznListingsProgress(shopDomain);
      await updateTaskWithQuery(
        { type: "CRAWL_AZN_LISTINGS", id: `crawl_azn_listings_${shopDomain}` },
        { progress: lookupProgress}
      );
      await updateTaskWithQuery(
        { type: "MATCH_PRODUCTS", id: `match_products_${shopDomain}` },
        { progress }
      );
    })
  );
};

updateTasksWithLookUpMatchStatus().then((r)=> {process.exit(0);});
