import { getShopsForService } from "../filteredShops";
import { getLookupInfoProgress } from "./getLookupInfoProgress";

export async function getUnmatchedEanShops() {
  const {filteredShops, shops} = await getShopsForService("lookupInfo"); 
  const lookupInfoProgressPerShop = await Promise.all(
    filteredShops.map(async (shop) => {
      const progress = await getLookupInfoProgress(
        shop.d,
        Boolean(shop.hasEan || shop?.ean)
      );
      return { pending: progress.pending, shop };
    })
  );

  const pendingShops = lookupInfoProgressPerShop.filter(
    (shop) => shop.pending > 0
  );
  return {pendingShops, shops}
}
