import { ProxyType } from "@dipmaxtech/clr-pkg";
import { getShopsForService } from "../../../filteredShops.js";
import { getTaskProgress } from "../../../multiShopUtilities/getTaskProgress.js";

export async function getOutdatedNegMarginAznListingsPerShop(
  proxyType: ProxyType
) {
  const { filteredShops, shops } = await getShopsForService(
    "NEG_AZN_DEALS",
    proxyType
  );
  const negMarginAznListingsProgressPerShop = await Promise.all(
    filteredShops.map(async (shop) => {
      const progress = await getTaskProgress(shop.d, "NEG_AZN_DEALS");
      return { pending: progress.pending, shop };
    })
  );

  const pendingShops = negMarginAznListingsProgressPerShop.filter(
    (shop) => shop.pending > 0
  );
  return { pendingShops, shops };
}
