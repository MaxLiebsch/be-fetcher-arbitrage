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
