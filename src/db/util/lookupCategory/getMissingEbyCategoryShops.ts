import { getShopsForService } from "../filteredShops.js";
import { getTaskProgress } from "../multiShopUtilities/getTaskProgress.js";

export async function getMissingEbyCategoryShops() {
  const { filteredShops, shops } = await getShopsForService("LOOKUP_CATEGORY");
  const lookupCategoryProgressPerShop = await Promise.all(
    filteredShops.map(async (shop) => {
      const progress = await getTaskProgress(shop.d, "LOOKUP_CATEGORY");
      return { pending: progress.pending, shop: shop };
    })
  );

  const pendingShops = lookupCategoryProgressPerShop.filter(
    (shop) => shop.pending > 0
  );
  return { pendingShops, shops };
}
