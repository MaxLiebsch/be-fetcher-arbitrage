import { ProxyType } from "@dipmaxtech/clr-pkg";
import { getShopsForService } from "../../../filteredShops.js";
import { getTaskProgressAgg } from "../../../multiShopUtilities/getTaskProgressAgg.js";

export async function getOutdatedDealsOnEbyShops(proxyType: ProxyType) {
  const { filteredShops, shops } = await getShopsForService(
    "DEALS_ON_EBY",
    proxyType
  );
  const dealsOnEbyProgressPerShop = await Promise.all(
    filteredShops.map(async (shop) => {
      const progress = await getTaskProgressAgg(shop.d, "DEALS_ON_EBY");
      return { pending: progress.pending, shop };
    })
  );

  const pendingShops = dealsOnEbyProgressPerShop.filter(
    (shop) => shop.pending > 0
  );
  return { pendingShops, shops };
}
