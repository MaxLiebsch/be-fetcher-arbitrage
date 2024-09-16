import { shuffle } from "underscore";
import { ObjectId } from "@dipmaxtech/clr-pkg";
import { findArbispotterProducts } from "../crudArbispotterProduct.js";
import { recoveryQueryEansOnEby } from "../queries.js";
import { getShopsForService } from "../filteredShops.js";
import { getProductsWithShop } from "../getProductsWithShop.js";
import { PendingShops } from "../../../types/shops.js";

export async function getRecoveryQueryEansOnEby(
  taskId: ObjectId,
  productLimit: number
) {
  const { filteredShops, shops } = await getShopsForService("queryEansOnEby");
  let pendingShops: PendingShops = [];
  const products = await Promise.all(
    filteredShops.map(async (shop) => {
      const products = await findArbispotterProducts(
        shop.d,
        recoveryQueryEansOnEby(taskId),
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
