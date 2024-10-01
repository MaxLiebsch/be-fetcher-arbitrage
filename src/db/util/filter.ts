import { ProxyType, Shop, TaskTypes } from "@dipmaxtech/clr-pkg";
import { MultiShopTaskTypes } from "../../util/taskTypes";

export const shopFilter = (
  shop: Pick<Shop, "d" | "hasEan" | "ean" | "active" | "proxyType">
) =>
  shop.active &&
  shop.d !== "sales" &&
  shop.d !== "sellercentral.amazon.de" &&
  shop.d !== "ebay.de" &&
  shop.d !== "amazon.de";

export const shopProxyTypeFilter = (
  shop: Pick<Shop, "d" | "hasEan" | "ean" | "active" | "proxyType">,
  proxyType: ProxyType
) =>
  shop.proxyType === proxyType &&
  shop.active &&
  shop.d !== "sales" &&
  shop.d !== "sellercentral.amazon.de" &&
  shop.d !== "ebay.de" &&
  shop.d !== "amazon.de";

export const crawlEanFilter = (
  shop: Pick<Shop, "d" | "hasEan" | "ean" | "active" | "proxyType">,
  proxyType: ProxyType
) => shop.hasEan && shop.active && shop.proxyType === proxyType;
export const lookupInfoFilter = (
  shop: Pick<Shop, "d" | "hasEan" | "ean" | "active" | "proxyType">,
  proxyType: ProxyType
) => shop.active;
export const lookupCategoryFilter = (
  shop: Pick<Shop, "d" | "hasEan" | "ean" | "active" | "proxyType">,
  proxyType: ProxyType
) => shop.active;
export const queryEansOnEbyFilter = (
  shop: Pick<Shop, "d" | "hasEan" | "ean" | "active" | "proxyType">,
  proxyType: ProxyType
) => (shop.hasEan || shop?.ean) && shop.active;

export const serviceShopFilters: {[key in MultiShopTaskTypes]: any} = {
  "CRAWL_EAN": crawlEanFilter,
  "LOOKUP_INFO": lookupInfoFilter,
  "LOOKUP_CATEGORY": lookupCategoryFilter,
  "QUERY_EANS_EBY": queryEansOnEbyFilter,
  "DEALS_ON_EBY": shopProxyTypeFilter,
  "DEALS_ON_AZN": shopProxyTypeFilter,
  "NEG_AZN_DEALS": shopProxyTypeFilter,
  "NEG_EBY_DEALS": shopProxyTypeFilter,
};
