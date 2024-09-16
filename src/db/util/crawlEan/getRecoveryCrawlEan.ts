import { shuffle } from "underscore";
import { findArbispotterProducts } from "../crudArbispotterProduct.js";
import { recoveryCrawlEanQuery } from "../queries.js";
import { getShopsForService } from "../filteredShops.js";
import { getProductsWithShop } from "../getProductsWithShop.js";
import { ObjectId, ProxyType } from "@dipmaxtech/clr-pkg";
import { PendingShops } from "../../../types/shops.js";

export async function getRecoveryCrawlEan(
  taskId: ObjectId,
  proxyType: ProxyType,
  productLimit: number
) {
  const { filteredShops, shops } = await getShopsForService(
    "crawlEan",
    proxyType
  );
  let pendingShops: PendingShops = [];
  const products = await Promise.all(
    filteredShops.map(async (shop) => {
      const products = await findArbispotterProducts(
        shop.d,
        recoveryCrawlEanQuery(taskId),
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
