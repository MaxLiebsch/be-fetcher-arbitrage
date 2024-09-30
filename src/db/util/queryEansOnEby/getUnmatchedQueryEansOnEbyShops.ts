import { getShopsForService } from "../filteredShops.js";
import { getTaskProgress } from "../multiShopUtilities/getTaskProgress.js";

export async function getUnmatchedQueryEansOnEbyShops() {
  const { filteredShops, shops } = await getShopsForService("QUERY_EANS_EBY");
  const queryEansOnEbyProgressPerShop = await Promise.all(
    filteredShops.map(async (shop) => {
      const progress = await getTaskProgress(shop.d, "QUERY_EANS_EBY");
      return { pending: progress.pending, shop };
    })
  );

  const pendingShops = queryEansOnEbyProgressPerShop.filter(
    (shop) => shop.pending > 0
  );
  return { pendingShops, shops };
}
