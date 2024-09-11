import { getAllShopsAsArray } from "../shops.js";
import { getUpdateProductinfoProgress } from "./getUpdateProductInfoProgress.js";

export async function getOutdatedUpdateProductinfoShops() {
  const shops = await getAllShopsAsArray();
  const filteredShops = shops.filter(
    (shop) => shop.active
  );
  const UpdateProductinfoProgressPerShop = await Promise.all(
    filteredShops.map(async (shop) => {
      const progress = await getUpdateProductinfoProgress(shop.d);
      return { pending: progress.pending, shop };
    })
  );

  const pendingShops = UpdateProductinfoProgressPerShop.filter(
    (shop) => shop.pending > 0
  );
  return {pendingShops, shops}
}
