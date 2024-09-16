import { getShopsForService } from "../filteredShops.js";
import { getLookupCategoryProgress } from "./getLookupCategoryProgress.js";

export async function getMissingEbyCategoryShops() {
  const {filteredShops, shops} = await getShopsForService("lookupCategory"); 
  const lookupCategoryProgressPerShop = await Promise.all(
    filteredShops.map(async (shop) => {
      const progress = await getLookupCategoryProgress(shop.d);
      return { pending: progress.pending, shop: shop };
    })
  );

  const pendingShops = lookupCategoryProgressPerShop.filter(
    (shop) => shop.pending > 0
  );
  return {pendingShops, shops}
}
