import { shopFilter } from "../../filter.js";
import { getAllShopsAsArray } from "../../shops.js";
import { getDealsOnAznProgress } from "./getDealsOnAznProgress.js";

export async function getOutdatedDealsOnAznShops() {
  const shops = await getAllShopsAsArray();
  const filteredShops = shops.filter(shopFilter);
  const dealsOnAznProgressPerShop = await Promise.all(
    filteredShops.map(async (shop) => {
      const progress = await getDealsOnAznProgress(shop.d);
      return { pending: progress.pending, shop };
    })
  );

  const pendingShops = dealsOnAznProgressPerShop.filter(
    (shop) => shop.pending > 0
  );
  return pendingShops;
}
