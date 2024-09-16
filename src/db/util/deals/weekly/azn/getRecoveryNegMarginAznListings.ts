import { shuffle } from "underscore";
import { findArbispotterProducts } from "../../../crudArbispotterProduct.js";
import { recoveryCrawlAznListingsQuery } from "../../../queries.js";
import { getShopsForService } from "../../../filteredShops.js";
import { getProductsWithShop } from "../../../getProductsWithShop.js";
import { ObjectId, ProxyType } from "@dipmaxtech/clr-pkg";
import { PendingShops } from "../../../../../types/shops.js";

export async function getRecoveryNegMarginAznListings(
  taskId: ObjectId,
  proxyType: ProxyType,
  productLimit: number
) {
  const { filteredShops, shops } = await getShopsForService(
    "negAznDeals",
    proxyType
  );
  let pendingShops: PendingShops = [];
  const products = await Promise.all(
    filteredShops.map(async (shop) => {
      const products = await findArbispotterProducts(
        shop.d,
        recoveryCrawlAznListingsQuery(taskId),
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
