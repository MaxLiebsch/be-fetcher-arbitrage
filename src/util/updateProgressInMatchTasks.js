import { getMatchProgress } from "../db/util/match/getMatchProgress.js";
import { updateTaskWithQuery } from "../db/util/tasks.js";

export const updateProgressInMatchTasks = async (infos) =>
  Promise.all(
    infos.map(async ({ shop, pending }) => {
      try {
        const shopDomain = shop.d;
        const progress = await getMatchProgress(shopDomain, shop.hasEan);
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

