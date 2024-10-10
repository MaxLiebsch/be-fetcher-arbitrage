import { salesDbName } from "../mongo.js";
import { serviceShopFilters } from "./filter.js";
import { getAllShopsAsArray } from "./shops.js";
import { ShopPick } from "../../types/shops.js";

export async function getShopsForService(
  service: keyof typeof serviceShopFilters
) {
  const shops = await getAllShopsAsArray();
  if (!shops) {
    throw new Error("No shops found");
  }
  const filteredShops = (shops as ShopPick[]).filter((shop) =>
    serviceShopFilters[service](shop)
  );

  filteredShops.push({
    d: salesDbName,
    hasEan: true,
    ean: "",
    active: true,
    proxyType: "mix",
  });

  return { filteredShops, shops };
}
