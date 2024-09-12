import { ProxyType, Shop } from "@dipmaxtech/clr-pkg";

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

export const serviceShopFilters = {
  crawlEan: crawlEanFilter,
  lookupInfo: lookupInfoFilter,
  lookupCategory: lookupCategoryFilter,
  queryEansOnEby: queryEansOnEbyFilter,
  dealsOnEby: shopProxyTypeFilter,
  dealsOnAzn: shopProxyTypeFilter,
  negAznDeals: shopProxyTypeFilter,
  negEbyDeals: shopProxyTypeFilter,
};
