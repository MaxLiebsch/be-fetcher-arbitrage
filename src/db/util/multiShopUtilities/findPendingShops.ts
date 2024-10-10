import { getShopsForService } from "../filteredShops.js";
import { getTaskProgress } from "../multiShopUtilities/getTaskProgress.js";
import { MultiShopTaskTypesWithQuery } from "../../../util/taskTypes.js";

export async function findPendingShops(
  taskType: MultiShopTaskTypesWithQuery,
) {
  const { filteredShops, shops } = await getShopsForService(
    taskType,
  );
  const crawlEanProgressPerShop = await Promise.all(
    filteredShops.map(async (shop) => {
      const progress = await getTaskProgress(shop.d, taskType, shop.hasEan);
      return { pending: progress.pending, shop: shop };
    })
  );

  const pendingShops = crawlEanProgressPerShop.filter(
    (shop) => shop.pending > 0
  );
  return { pendingShops, shops };
}
