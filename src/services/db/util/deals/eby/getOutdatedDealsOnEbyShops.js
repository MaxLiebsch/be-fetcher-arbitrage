import { shopFilter, shopProxyTypeFilter } from "../../filter.js";
import { getAllShopsAsArray } from "../../shops.js";
import { getDealsOnEbyProgressAgg } from "./getDealsOnEbyListingsProgressAggregation.js";

export async function getOutdatedDealsOnEbyShops(proxyType) {
  const shops = await getAllShopsAsArray();
  const filteredShops = shops.filter((shop) =>
    shopProxyTypeFilter(shop, proxyType)
  );
  const dealsOnEbyProgressPerShop = await Promise.all(
    filteredShops.map(async (shop) => {
      const progress = await getDealsOnEbyProgressAgg(shop.d);
      return { pending: progress.pending, shop };
    })
  );

  const pendingShops = dealsOnEbyProgressPerShop.filter(
    (shop) => shop.pending > 0
  );
  return pendingShops;
}
