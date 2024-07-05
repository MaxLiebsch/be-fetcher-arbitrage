import { getAllShopsAsArray } from "../shops.js";
import { getLookupInfoProgress } from "./getLookupInfoProgress.js";

export async function getUnmatchedEanShops() {
  const shops = await getAllShopsAsArray();
  const filteredShops = shops.filter((shop) => shop.active);
  const lookupInfoProgressPerShop = await Promise.all(
    filteredShops.map(async (shop) => {
      const progress = await getLookupInfoProgress(
        shop.d,
        shop.hasEan || shop?.ean
      );
      return { pending: progress.pending, shop };
    })
  );

  const pendingShops = lookupInfoProgressPerShop.filter(
    (shop) => shop.pending > 0
  );
  return pendingShops;
}
