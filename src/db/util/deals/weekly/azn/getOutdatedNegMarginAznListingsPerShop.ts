import { ProxyType } from "@dipmaxtech/clr-pkg";
import { getCrawlAznListingsProgress } from "./getNegMarginAznListingsProgress.js";
import { getShopsForService } from "../../../filteredShops.js";

export async function getOutdatedNegMarginAznListingsPerShop(
  proxyType: ProxyType
) {
  const { filteredShops, shops } = await getShopsForService(
    "negAznDeals",
    proxyType
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
  return { pendingShops, shops };
}
