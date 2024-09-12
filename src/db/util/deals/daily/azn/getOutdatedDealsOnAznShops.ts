import { ProxyType } from "@dipmaxtech/clr-pkg";
import { getShopsForService } from "../../../filteredShops";
import { getDealsOnAznProgress } from "./getDealsOnAznProgress";

export async function getOutdatedDealsOnAznShops(proxyType: ProxyType) {
  const { filteredShops, shops } = await getShopsForService(
    "dealsOnAzn",
    proxyType
  );
  const dealsOnAznProgressPerShop = await Promise.all(
    filteredShops.map(async (shop) => {
      const progress = await getDealsOnAznProgress(shop.d);
      return { pending: progress.pending, shop };
    })
  );

  const pendingShops = dealsOnAznProgressPerShop.filter(
    (shop) => shop.pending > 0
  );
  return { pendingShops, shops };
}
