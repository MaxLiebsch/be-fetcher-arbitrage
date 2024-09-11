import { getShopsForService } from "../../../filteredShops.js";
import { getDealsOnEbyProgressAgg } from "./getDealsOnEbyListingsProgressAggregation.js";

export async function getOutdatedDealsOnEbyShops(proxyType) {
  const {filteredShops, shops} = await getShopsForService("dealsOnEby", proxyType);  
  const dealsOnEbyProgressPerShop = await Promise.all(
    filteredShops.map(async (shop) => {
      const progress = await getDealsOnEbyProgressAgg(shop.d);
      return { pending: progress.pending, shop };
    })
  );

  const pendingShops = dealsOnEbyProgressPerShop.filter(
    (shop) => shop.pending > 0
  );
  return {pendingShops, shops}
}
