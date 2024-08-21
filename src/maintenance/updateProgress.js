
import { getAllShopsAsArray } from "../../src/services/db/util/shops.js";
import { updateTaskWithQuery } from "../../src/services/db/util/tasks.js";
import { getCrawlAznListingsProgress } from "../services/db/util/crawlAznListings/getCrawlAznListingsProgress.js";
import { getMatchProgress } from "../services/db/util/match/getMatchProgress.js";

const main = async () => {
  const shops = await getAllShopsAsArray();
  const activeShops = shops.filter((shop) => shop.active);
  return await Promise.all(
    activeShops.map(async (shop) => {
      const progress = await getMatchProgress(shop.d);
      const lookupProgress = await getCrawlAznListingsProgress(shop.d);
      return Promise.all([
        updateTaskWithQuery(
          { type: "CRAWL_AZN_LISTINGS", id: `crawl_azn_listings_${shop.d}` },
          { progress: lookupProgress }
        ),
        updateTaskWithQuery(
          { type: "MATCH_PRODUCTS", id: `match_products_${shop.d}` },
          { progress }
        ),
      ]);
    })
  );
};

main().then((r) => process.exit(0));
