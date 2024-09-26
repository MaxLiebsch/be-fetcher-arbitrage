import { getActiveShops, updateShopStats } from "./shops.js";

export async function updateAllShopsStats() {
  const activeShops = await getActiveShops();
  if (!activeShops) return;

  for (let index = 0; index < activeShops.length; index++) {
    const shopDomain = activeShops[index].d;
    await updateShopStats(shopDomain);
  }
}
