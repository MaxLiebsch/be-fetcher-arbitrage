import { shuffle } from "underscore";
import { recoveryDealsOnEbyQuery } from "../../../queries.js";
import { findArbispotterProducts } from "../../../crudArbispotterProduct.js";
import { getShopsForService } from "../../../filteredShops.js";
import { getProductsWithShop } from "../../../getProductsWithShop.js";

export async function getRecoveryDealsOnEby(taskId, proxyType, productLimit) {
  const {filteredShops, shops} = await getShopsForService("dealsOnEby", proxyType);
  let pendingShops = [];
  const products = await Promise.all(
    filteredShops.map(async (shop) => {
      const products = await findArbispotterProducts(
        shop.d,
        recoveryDealsOnEbyQuery(taskId),
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
