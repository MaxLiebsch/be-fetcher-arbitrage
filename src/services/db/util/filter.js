export const shopFilter = (shop) =>
  shop.active &&
  shop.d !== "sales" &&
  shop.d !== "sellercentral.amazon.de" &&
  shop.d !== "ebay.de" &&
  shop.d !== "amazon.de";

export const shopProxyTypeFilter = (shop, proxyType) =>
  shop.proxyType === proxyType &&
  shop.active &&
  shop.d !== "sales" &&
  shop.d !== "sellercentral.amazon.de" &&
  shop.d !== "ebay.de" &&
  shop.d !== "amazon.de";

export const crawlEanFilter = (shop, proxyType) =>
  shop.hasEan && shop.active && shop.proxyType === proxyType;
export const lookupInfoFilter = (shop, proxyType) => shop.active;
export const lookupCategoryFilter = (shop, proxyType) => shop.active;
export const queryEansOnEbyFilter = (shop, proxyType) =>
  (shop.hasEan || shop?.ean) && shop.active;

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
