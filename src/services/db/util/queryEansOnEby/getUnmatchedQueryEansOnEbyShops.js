import { getAllShopsAsArray } from "../shops.js";
import { getQueryEansOnEbyProgress } from "./getQueryEansOnEbyProgress.js";

export async function getUnmatchedQueryEansOnEbyShops() {
  const shops = await getAllShopsAsArray();
  const filteredShops = shops.filter(
    (shop) =>
      (shop.hasEan || shop?.ean) && shop.active
  );
  const queryEansOnEbyProgressPerShop = await Promise.all(
    filteredShops.map(async (shop) => {
      const progress = await getQueryEansOnEbyProgress(shop.d);
      return { pending: progress.pending, shop };
    })
  );

  const pendingShops = queryEansOnEbyProgressPerShop.filter(
    (shop) => shop.pending > 0
  );
  return pendingShops;
}
