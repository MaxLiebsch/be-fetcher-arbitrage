import { getTaskProgress } from "../db/util/multiShopUtilities/getTaskProgress.js";
import { updateTaskWithQuery } from "../db/util/tasks.js";
import { PendingShops } from "../types/shops.js";

export const updateProgressInMatchTasks = async (pendingShops: PendingShops) =>
  Promise.all(
    pendingShops.map(async ({ shop, pending }) => {
      try {
        const shopDomain = shop.d;
        const progress = await getTaskProgress(
          shopDomain,
          "MATCH_PRODUCTS",
          shop.hasEan
        );
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
