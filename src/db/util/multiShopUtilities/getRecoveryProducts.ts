import { ObjectId, ProxyType } from "@dipmaxtech/clr-pkg";
import {  MultiShopTaskTypes } from "../../../util/taskTypes.js";
import { getShopsForService } from "../filteredShops.js";
import {
  findProducts,
} from "../crudProducts.js";
import { PendingShops } from "../../../types/shops.js";
import { getProductsWithShop } from "../getProductsWithShop.js";
import { shuffle } from "underscore";
import { recoverQueries } from "./recoverQueries.js";

export async function getRecoveryProducts(
  multiStopTask: MultiShopTaskTypes,
  taskId: ObjectId,
  productLimit: number,
  proxyType: ProxyType | undefined = undefined
) {
  const { filteredShops, shops } = await getShopsForService(
    multiStopTask,
    proxyType
  );
  let pendingShops: PendingShops = [];
  const products = await Promise.all(
    filteredShops.map(async (shop) => {
      const products = await findProducts(
        recoverQueries[multiStopTask](taskId, shop.d),
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
