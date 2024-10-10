import { getTaskProgressAgg } from "./getTaskProgressAgg.js";
import { getShopsForService } from "../filteredShops.js";
import { MultiShopTaskTypesWithAgg } from "../../../util/taskTypes.js";

export async function findPendingShopsWithAgg(
  taskType: MultiShopTaskTypesWithAgg,
) {
  const { filteredShops, shops } = await getShopsForService(
    taskType,
  );
  const negMarginEbyListingsProgressPerShop = await Promise.all(
    filteredShops.map(async (shop) => {
      const progress = await getTaskProgressAgg(shop.d, taskType);
      return { pending: progress.pending, shop };
    })
  );

  const pendingShops = negMarginEbyListingsProgressPerShop.filter(
    (shop) => shop.pending > 0
  );
  return { pendingShops, shops };
}
