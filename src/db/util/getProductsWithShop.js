import { salesDbName } from "../mongo.js";

export function getProductsWithShop(products, shop, shops) {
  const { d: shopDomain } = shop;
  return products
    .map((product) => {
      const { shop: productShopDomain } = product;
      if (shopDomain === salesDbName) {
        let _shop = shops.find((shop) => shop.d === productShopDomain);
        if (!_shop) {
          return null;
        }
        _shop.d = salesDbName;

        return { shop: _shop, product };
      }
      return { shop, product };
    })
    .filter((productWithShop) => productWithShop !== null);
}
