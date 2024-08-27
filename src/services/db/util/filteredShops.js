import { salesDbName } from "../../productPriceComparator.js";
import { serviceShopFilters } from "./filter.js";
import { getAllShopsAsArray } from "./shops.js";

export async function getShopsForService(service, proxyType = "mix") {
  const shops = await getAllShopsAsArray();
  const filteredShops = shops.filter((shop) =>
    serviceShopFilters[service](shop, proxyType)
  );
  filteredShops.push({ d: salesDbName });
  
  return { filteredShops, shops };
}
