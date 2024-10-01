import { ProxyType, Shop } from "@dipmaxtech/clr-pkg";
import { salesDbName } from "../mongo.js";
import { serviceShopFilters } from "./filter.js";
import { getAllShopsAsArray } from "./shops.js";

export async function getShopsForService(
  service: keyof typeof serviceShopFilters,
  proxyType: ProxyType = "mix"
) {
  const shops = await getAllShopsAsArray();
  if (!shops) {
    throw new Error("No shops found");
  }
  const filteredShops = (
    shops as Pick<Shop, "d" | "hasEan" | "ean" | "active" | "proxyType">[]
  ).filter((shop) => serviceShopFilters[service](shop, proxyType));

  filteredShops.push({
    d: salesDbName,
    hasEan: true,
    ean: "",
    active: true,
    proxyType,
  });

  return { filteredShops, shops };
}
