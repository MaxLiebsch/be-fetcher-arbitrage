import { getAmazonLookupProgress } from "../src/services/db/util/getLookupProgress.js";
import { getMatchingProgress } from "../src/services/db/util/getMatchingProgress.js";
import { getAllShopsAsArray } from "../src/services/db/util/shops.js";
import { updateTaskWithQuery } from "../src/services/db/util/tasks.js";

const main = async () => {
  const shops = await getAllShopsAsArray();
  const activeShops = shops.filter((shop) => shop.active);
  return await Promise.all(
    activeShops.map(async (shop) => {
      const progress = await getMatchingProgress(shop.d);
      const lookupProgress = await getAmazonLookupProgress(shop.d);
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
