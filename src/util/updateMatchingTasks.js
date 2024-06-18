import { getMatchingProgress } from "../services/db/util/getMatchingProgress.js";
import { updateTaskWithQuery } from "../services/db/util/tasks.js";

export const updateMatchingTasks = async (infos) =>
  Promise.all(
    infos.map(async ({ shop, pending }) => {
      try {
        const shopDomain = shop.d;
        const progress = await getMatchingProgress(shopDomain);
        if (progress)
          return updateTaskWithQuery(
            {
              type: "MATCH_PRODUCTS",
              id: `match_products_${shopDomain}`,
            },
            { progress }
          );
      } catch (error) {
        console.error(`Error processing shop ${shop.d}:`, error);
      }
    })
  );
