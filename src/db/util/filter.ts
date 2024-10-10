import { MultiShopTaskTypes } from "../../util/taskTypes";
import { ShopPick } from "../../types/shops";

export const shopFilter = (shop: ShopPick) =>
  shop.active &&
  shop.d !== "sales" &&
  shop.d !== "sellercentral.amazon.de" &&
  shop.d !== "ebay.de" &&
  shop.d !== "amazon.de";

export const crawlEanFilter = (shop: ShopPick) => shop.hasEan && shop.active;
export const lookupInfoFilter = (shop: ShopPick) => shop.active;
export const lookupCategoryFilter = (shop: ShopPick) => shop.active;
export const queryEansOnEbyFilter = (shop: ShopPick) =>
  (shop.hasEan || shop?.ean) && shop.active;

export const serviceShopFilters: { [key in MultiShopTaskTypes]: any } = {
  CRAWL_EAN: crawlEanFilter,
  LOOKUP_INFO: lookupInfoFilter,
  LOOKUP_CATEGORY: lookupCategoryFilter,
  QUERY_EANS_EBY: queryEansOnEbyFilter,
  DEALS_ON_EBY: shopFilter,
  DEALS_ON_AZN: shopFilter,
  NEG_AZN_DEALS: shopFilter,
  NEG_EBY_DEALS: shopFilter,
};
