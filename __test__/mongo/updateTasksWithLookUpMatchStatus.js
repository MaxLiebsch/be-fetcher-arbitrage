import { getAmazonLookupProgress } from "../../src/service/db/util/getLookupProgress.js";
import { getMatchingProgress } from "../../src/service/db/util/getMatchingProgress.js";
import { updateTaskWithQuery } from "../../src/service/db/util/tasks.js";

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
      const progress = await getMatchingProgress(shopDomain);
      const lookupProgress = await getAmazonLookupProgress(shopDomain);
      await updateTaskWithQuery(
        { type: "LOOKUP_PRODUCTS", id: `lookup_products_${shopDomain}` },
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
