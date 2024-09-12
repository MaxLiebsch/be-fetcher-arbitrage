import { ProxyType } from "@dipmaxtech/clr-pkg";
import { getShopsForService } from "../filteredShops";
import { getCrawlEanProgress } from "./getCrawlEanProgress";

export async function getMissingEanShops(proxyType: ProxyType) {
  const { filteredShops, shops } = await getShopsForService(
    "crawlEan",
    proxyType
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
  return { pendingShops, shops };
}
