import { shuffle } from "underscore";
import { getAllShopsAsArray } from "../shops.js";
import { updateTaskWithQuery } from "../tasks.js";
import { lockProductsForLookupInfo } from "./lockProductsForLookupInfo.js";
import { getUnmatchedEanShops } from "./getUnmatchedEanShops.js";
import { findArbispotterProducts } from "../crudArbispotterProduct.js";
import { recoveryLookupInfoQuery } from "../queries.js";

export async function lookForUnmatchedEans(taskId, action, productLimit) {
  if (action === "recover") {
    const recoveryProducts = await getRecoveryLookupInfoProduts(
      taskId,
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
    const pendingShops = await getUnmatchedEanShops();
    const stats = pendingShops.reduce((acc, { pending, shop }) => {
      acc[shop.d] = { shopDomain: shop.d, pending, batch: 0 };
      return acc;
    }, {});

    const numberOfShops = pendingShops.length;
    const productsPerShop = Math.round(productLimit / numberOfShops);

    const products = await Promise.all(
      pendingShops.map(async ({ shop, pending }) => {
        const products = await lockProductsForLookupInfo(
          shop.d,
          productsPerShop,
          action,
          taskId,
          shop.hasEan || shop?.ean
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

export async function getRecoveryLookupInfoProduts(
  taskId,
  productLimit
) {
  const shops = await getAllShopsAsArray();
  const filteredShops = shops.filter((shop) => shop.active);
  let pendingShops = [];
  const products = await Promise.all(
    filteredShops.map(async (shop) => {
      const products = await findArbispotterProducts(
        shop.d,
        recoveryLookupInfoQuery(taskId),
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
