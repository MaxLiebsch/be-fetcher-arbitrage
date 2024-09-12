import { ProxyType } from "@dipmaxtech/clr-pkg";
import { getCrawlEbyListingsProgressAggregation } from "../../../crawlEbyListings/getCrawlEbyListingsProgressAggregation";
import { getShopsForService } from "../../../filteredShops";

export async function getOutdatedNegMarginEbyListingsPerShop(
  proxyType: ProxyType
) {
  const { filteredShops, shops } = await getShopsForService(
    "negEbyDeals",
    proxyType
  );
  const negMarginEbyListingsProgressPerShop = await Promise.all(
    filteredShops.map(async (shop) => {
      const progress = await getCrawlEbyListingsProgressAggregation(shop.d);
      return { pending: progress.pending, shop };
    })
  );

  const pendingShops = negMarginEbyListingsProgressPerShop.filter(
    (shop) => shop.pending > 0
  );
  return { pendingShops, shops };
}
