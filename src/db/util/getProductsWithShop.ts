import {
  DbProductRecord,
  getMainDomainFromUrl,
  Shop,
} from "@dipmaxtech/clr-pkg";
import { salesDbName } from "../mongo.js";
import { ShopPick } from "../../types/shops.js";

export function getProductsWithShop(
  products: DbProductRecord[],
  shop: ShopPick,
  shops: Shop[]
) {
  const { d: shopDomain } = shop;
  return products
    .map((product) => {
      if (shopDomain === salesDbName) {
        const { shop, lnk } = product;
        let productShopDomain = shop;
        if (!productShopDomain) {
          productShopDomain = getMainDomainFromUrl(lnk);
        }
        const _shop = shops.find((shop) => shop.d === productShopDomain);
        if (!_shop) {
          return null;
        }
        const foundShop = { ..._shop, d: salesDbName };

        return { shop: foundShop, product };
      }
      return { shop, product };
    })
    .filter((productWithShop) => productWithShop !== null);
}
