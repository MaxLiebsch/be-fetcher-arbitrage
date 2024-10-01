import { ProxyType } from "@dipmaxtech/clr-pkg";
import { getShopsForService } from "../filteredShops.js";
import { getTaskProgress } from "../multiShopUtilities/getTaskProgress.js";
import { MultiShopTaskTypesWithQuery } from "../../../util/taskTypes.js";

export async function findPendingShops(
  taskType: MultiShopTaskTypesWithQuery,
  proxyType?: ProxyType
) {
  const { filteredShops, shops } = await getShopsForService(
    taskType,
    proxyType
  );
  const crawlEanProgressPerShop = await Promise.all(
    filteredShops.map(async (shop) => {
      const progress = await getTaskProgress(shop.d, taskType);
      return { pending: progress.pending, shop: shop };
    })
  );

  const pendingShops = crawlEanProgressPerShop.filter(
    (shop) => shop.pending > 0
  );
  return { pendingShops, shops };
}
