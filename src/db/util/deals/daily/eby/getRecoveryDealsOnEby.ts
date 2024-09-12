import { shuffle } from "underscore";
import { recoveryDealsOnEbyQuery } from "../../../queries.js";
import { findArbispotterProducts } from "../../../crudArbispotterProduct.js";
import { getShopsForService } from "../../../filteredShops.js";
import { getProductsWithShop } from "../../../getProductsWithShop.js";
import { PendingShops } from "../../../../../types/shops.js";
import { ObjectId, ProxyType } from "@dipmaxtech/clr-pkg";

export async function getRecoveryDealsOnEby(
  taskId: ObjectId,
  proxyType: ProxyType,
  productLimit: number
) {
  const { filteredShops, shops } = await getShopsForService(
    "dealsOnEby",
    proxyType
  );
  let pendingShops: PendingShops = [];
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
