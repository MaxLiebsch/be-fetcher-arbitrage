import { shuffle } from "underscore";
import { lockProductsForEanLookup } from "./crudCrawlDataProduct.js";
import { getEanLookupProgress } from "./getEanLookupProgress.js";
import { getAllShopsAsArray } from "./shops.js";
import { updateTaskWithQuery } from "./tasks.js";

export async function lookForPendingEanLookups(
  taskId,
  proxyType,
  action,
  productLimit
) {
  const shops = await getAllShopsAsArray();
  const filteredShops = shops.filter(
    (shop) => shop.hasEan && shop.active && shop.proxyType === proxyType
  );

  const eanLookupProgressPerShop = await Promise.all(
    filteredShops.map(async (shop) => {
      const progress = await getEanLookupProgress(shop.d);
      return { pending: progress.pending, shop: shop };
    })
  );

  const pendingShops = eanLookupProgressPerShop.filter(
    (shop) => shop.pending > 0
  );

  const stats = pendingShops.reduce((acc, { pending, shop }) => {
    acc[shop.d] = { shopDomain: shop.d, pending, batch: 0 };
    return acc;
  }, {});

  const numberOfShops = pendingShops.length;
  const productsPerShop = Math.round(productLimit / numberOfShops);

  const products = await Promise.all(
    pendingShops.map(async ({ shop, pending }) => {
      const limit = Math.min(pending, productsPerShop);
      const products = await lockProductsForEanLookup(
        shop.d,
        limit,
        action,
        taskId
      );

      const productsWithShop = products.map((product) => {
        return { shop, product };
      });
      stats[shop.d].batch = productsWithShop.length;
      return productsWithShop;
    })
  );

  const progress = pendingShops.reduce((acc, { shop, pending }) => {
    acc.push({
      shop: shop.d,
      pending,
    });
    return acc;
  }, []);

  console.log(
    "Ean lookup:\n",
    Object.values(stats)
      .map((info) => `${info.shopDomain}: p: ${info.pending} b: ${info?.batch}\n`)
      .join("")
  );

  await updateTaskWithQuery({ _id: taskId }, { progress });

  return {
    products: shuffle(products).flatMap((ps) => ps),
    shops: pendingShops,
  };
}
