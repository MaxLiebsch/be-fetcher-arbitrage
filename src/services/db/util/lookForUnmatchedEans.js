import { shuffle } from "underscore";
import { findCrawlDataProducts } from "./crudCrawlDataProduct.js";
import { getAllShopsAsArray } from "./shops.js";
import { updateTaskWithQuery } from "./tasks.js";
import { hostname } from "../mongo.js";
import { getLookupInfoProgress } from "./getLookupInfoProgress.js";
import { lockProductsForLookupInfo } from "./lockProductsForLookupInfo.js";

export async function lookForUnmatchedEans(
  taskId,
  proxyType,
  action,
  productLimit
) {
  if (action === "recover") {
    const recoveryProducts = await getRecoveryEanLookups(
      taskId,
      proxyType,
      productLimit
    );
    console.log(
      "Lookup Info:\n",
      recoveryProducts.shops
        .map((info) => `${info.shop.d}: p: ${info.pending}\n`)
        .join("")
    );
    return recoveryProducts;
  } else {
    const pendingShops = await getUnmatchecEanShops();
    const stats = pendingShops.reduce((acc, { pending, shop }) => {
      acc[shop.d] = { shopDomain: shop.d, pending, batch: 0 };
      return acc;
    }, {});

    const numberOfShops = pendingShops.length;
    const productsPerShop = Math.round(productLimit / numberOfShops);

    const products = await Promise.all(
      pendingShops.map(async ({ shop, pending }) => {
        const limit = Math.min(pending, productsPerShop);
        const products = await lockProductsForLookupInfo(
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
      "Lookup Info:\n",
      Object.values(stats)
        .map(
          (info) => `${info.shopDomain}: p: ${info.pending} b: ${info?.batch}\n`
        )
        .join("")
    );

    await updateTaskWithQuery({ _id: taskId }, { progress });

    return {
      products: shuffle(products).flatMap((ps) => ps),
      shops: pendingShops,
    };
  }
}

export async function getRecoveryEanLookups(taskId, proxyType, productLimit) {
  const shops = await getAllShopsAsArray();
  const filteredShops = shops.filter(
    (shop) => (shop.hasEan || shop?.ean) && shop.active && shop.proxyType === proxyType
  );
  let pendingShops = [];
  const products = await Promise.all(
    filteredShops.map(async (shop) => {
      const products = await findCrawlDataProducts(
        shop.d,
        {
          info_taskId: `${hostname}:${taskId.toString()}`,
        },
        productLimit
      );
      if (products.length > 0) {
        pendingShops.push({ shop, pending: products.length });
      }
      const productsWithShop = products.map((product) => {
        return { shop, product };
      });
      return productsWithShop;
    })
  );
  return {
    products: shuffle(products).flatMap((ps) => ps),
    shops: pendingShops,
  };
}

export async function getUnmatchecEanShops() {
  const shops = await getAllShopsAsArray();
  const filteredShops = shops.filter((shop) => (shop.hasEan || shop?.ean) && shop.active);
  const lookupInfoProgressPerShop = await Promise.all(
    filteredShops.map(async (shop) => {
      const progress = await getLookupInfoProgress(shop.d);
      return { pending: progress.pending, shop: shop };
    })
  );

  const pendingShops = lookupInfoProgressPerShop.filter(
    (shop) => shop.pending > 0
  );
  return pendingShops;
}
