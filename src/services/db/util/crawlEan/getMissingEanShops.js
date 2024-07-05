import { getAllShopsAsArray } from "../shops.js";
import { getCrawlEanProgress } from "./getCrawlEanProgress.js";

export async function getMissingEanShops(proxyType) {
  const shops = await getAllShopsAsArray();
  const filteredShops = shops.filter(
    (shop) => shop.hasEan && shop.active && shop.proxyType === proxyType
  );

  const crawlEanProgressPerShop = await Promise.all(
    filteredShops.map(async (shop) => {
      const progress = await getCrawlEanProgress(shop.d);
      return { pending: progress.pending, shop: shop };
    })
  );

  const pendingShops = crawlEanProgressPerShop.filter(
    (shop) => shop.pending > 0
  );
  return pendingShops;
}
