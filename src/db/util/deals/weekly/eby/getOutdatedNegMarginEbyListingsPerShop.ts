import { ProxyType } from "@dipmaxtech/clr-pkg";
import { getShopsForService } from "../../../filteredShops.js";
import { getTaskProgressAgg } from "../../../multiShopUtilities/getTaskProgressAgg.js";

export async function getOutdatedNegMarginEbyListingsPerShop(
  proxyType: ProxyType
) {
  const { filteredShops, shops } = await getShopsForService(
    "NEG_EBY_DEALS",
    proxyType
  );
  const negMarginEbyListingsProgressPerShop = await Promise.all(
    filteredShops.map(async (shop) => {
      const progress = await getTaskProgressAgg(shop.d, 'NEG_EBY_DEALS');
      return { pending: progress.pending, shop };
    })
  );

  const pendingShops = negMarginEbyListingsProgressPerShop.filter(
    (shop) => shop.pending > 0
  );
  return { pendingShops, shops };
}
