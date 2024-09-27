import { ProxyType } from "@dipmaxtech/clr-pkg";
import { getNegMarginEbyListingsProgressAggregation } from "./getNegMarginEbyListingsProgressAggregation.js";
import { getShopsForService } from "../../../filteredShops.js";

export async function getOutdatedNegMarginEbyListingsPerShop(
  proxyType: ProxyType
) {
  const { filteredShops, shops } = await getShopsForService(
    "negEbyDeals",
    proxyType
  );
  const negMarginEbyListingsProgressPerShop = await Promise.all(
    filteredShops.map(async (shop) => {
      const progress = await getNegMarginEbyListingsProgressAggregation(shop.d);
      return { pending: progress.pending, shop };
    })
  );

  const pendingShops = negMarginEbyListingsProgressPerShop.filter(
    (shop) => shop.pending > 0
  );
  return { pendingShops, shops };
}
