import { ProxyType } from "@dipmaxtech/clr-pkg";
import { getShopsForService } from "../filteredShops.js";
import { getTaskProgress } from "../multiShopUtilities/getTaskProgress.js";

export async function getMissingEanShops(proxyType: ProxyType) {
  const { filteredShops, shops } = await getShopsForService(
    "CRAWL_EAN",
    proxyType
  );
  const crawlEanProgressPerShop = await Promise.all(
    filteredShops.map(async (shop) => {
      const progress = await getTaskProgress(shop.d, "CRAWL_EAN");
      return { pending: progress.pending, shop: shop };
    })
  );

  const pendingShops = crawlEanProgressPerShop.filter(
    (shop) => shop.pending > 0
  );
  return { pendingShops, shops };
}
