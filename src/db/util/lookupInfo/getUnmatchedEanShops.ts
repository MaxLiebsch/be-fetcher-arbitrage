import { getShopsForService } from "../filteredShops.js";
import { getTaskProgress } from "../multiShopUtilities/getTaskProgress.js";

export async function getUnmatchedEanShops() {
  const { filteredShops, shops } = await getShopsForService("LOOKUP_INFO");
  const lookupInfoProgressPerShop = await Promise.all(
    filteredShops.map(async (shop) => {
      const progress = await getTaskProgress(
        shop.d,
        "LOOKUP_INFO",
        Boolean(shop.hasEan || shop?.ean)
      );
      return { pending: progress.pending, shop };
    })
  );

  const pendingShops = lookupInfoProgressPerShop.filter(
    (shop) => shop.pending > 0
  );
  return { pendingShops, shops };
}
