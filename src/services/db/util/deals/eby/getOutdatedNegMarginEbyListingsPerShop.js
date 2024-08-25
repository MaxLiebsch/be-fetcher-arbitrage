import { getCrawlEbyListingsProgressAggregation } from "../../crawlEbyListings/getCrawlEbyListingsProgressAggregation.js";
import { shopProxyTypeFilter } from "../../filter.js";
import { getAllShopsAsArray } from "../../shops.js";

export async function getOutdatedNegMarginEbyListingsPerShop(proxyType) {
  const shops = await getAllShopsAsArray();
  const filteredShops = shops.filter((shop) =>
    shopProxyTypeFilter(shop, proxyType)
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
  return pendingShops;
}
