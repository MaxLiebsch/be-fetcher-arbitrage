import { shopProxyTypeFilter } from "../../filter.js";
import { getAllShopsAsArray } from "../../shops.js";
import { getCrawlAznListingsProgress } from "../../crawlAznListings/getCrawlAznListingsProgress.js";

export async function getOutdatedNegMarginAznListingsPerShop(proxyType) {
  const shops = await getAllShopsAsArray();
  const filteredShops = shops.filter((shop) =>
    shopProxyTypeFilter(shop, proxyType)
  );
  const negMarginAznListingsProgressPerShop = await Promise.all(
    filteredShops.map(async (shop) => {
      const progress = await getCrawlAznListingsProgress(shop.d);
      return { pending: progress.pending, shop };
    })
  );

  const pendingShops = negMarginAznListingsProgressPerShop.filter(
    (shop) => shop.pending > 0
  );
  return pendingShops;
}
