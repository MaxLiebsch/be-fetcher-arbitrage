import { getShopsForService } from "../filteredShops";
import { getQueryEansOnEbyProgress } from "./getQueryEansOnEbyProgress.js";

export async function getUnmatchedQueryEansOnEbyShops() {
  const {filteredShops, shops} = await getShopsForService("queryEansOnEby"); 
  const queryEansOnEbyProgressPerShop = await Promise.all(
    filteredShops.map(async (shop) => {
      const progress = await getQueryEansOnEbyProgress(shop.d);
      return { pending: progress.pending, shop };
    })
  );

  const pendingShops = queryEansOnEbyProgressPerShop.filter(
    (shop) => shop.pending > 0
  );
  return {pendingShops, shops}
}
