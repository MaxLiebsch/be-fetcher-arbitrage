import { activeShops } from "../src/constants.js";
import { getAmazonLookupProgress } from "../src/service/db/util/getLookupProgress.js";
import { getMatchingProgress } from "../src/service/db/util/getMatchingProgress.js";
import { updateTaskWithQuery } from "../src/service/db/util/tasks.js";

const main = async () => {
  return await Promise.all(
    activeShops.map(async (shopDomain) => {
      const progress = await getMatchingProgress(shopDomain);
      const lookupProgress = await getAmazonLookupProgress(shopDomain);
      await updateTaskWithQuery(
        { type: "LOOKUP_PRODUCTS", id: `lookup_products_${shopDomain}` },
        { progress: lookupProgress }
      );
      await updateTaskWithQuery(
        { type: "MATCH_PRODUCTS", id: `match_products_${shopDomain}` },
        { progress }
      );
    })
  );
};

main().then((r) => process.exit(0));
