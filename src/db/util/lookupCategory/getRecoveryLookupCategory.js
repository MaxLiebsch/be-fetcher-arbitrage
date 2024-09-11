import { shuffle } from "underscore";
import { findArbispotterProducts } from "../crudArbispotterProduct.js";
import { recoveryLookupCategoryQuery } from "../queries.js";
import { getShopsForService } from "../filteredShops.js";
import { getProductsWithShop } from "../getProductsWithShop.js";


export async function getRecoveryLookupCategory(taskId, productLimit) {
  const {filteredShops, shops} = await getShopsForService("lookupCategory");
  let pendingShops = [];
  const products = await Promise.all(
    filteredShops.map(async (shop) => {
      const products = await findArbispotterProducts(
        shop.d,
        recoveryLookupCategoryQuery(taskId),
        productLimit
      );
      if (products.length > 0) {
        pendingShops.push({ shop, pending: products.length });
      }
      const productsWithShop = getProductsWithShop(products, shop, shops);
      return productsWithShop;
    })
  );
  return {
    products: shuffle(products).flatMap((ps) => ps),
    shops: pendingShops,
  };
}