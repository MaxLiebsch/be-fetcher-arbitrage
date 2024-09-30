import { ProxyType } from "@dipmaxtech/clr-pkg";
import { getShopsForService } from "../../../filteredShops.js";
import { getTaskProgress } from "../../../multiShopUtilities/getTaskProgress.js";

export async function getOutdatedDealsOnAznShops(proxyType: ProxyType) {
  const { filteredShops, shops } = await getShopsForService(
    "DEALS_ON_AZN",
    proxyType
  );
  const dealsOnAznProgressPerShop = await Promise.all(
    filteredShops.map(async (shop) => {
      const progress = await getTaskProgress(shop.d, "DEALS_ON_AZN");
      return { pending: progress.pending, shop };
    })
  );

  const pendingShops = dealsOnAznProgressPerShop.filter(
    (shop) => shop.pending > 0
  );
  return { pendingShops, shops };
}
