import { shuffle } from "underscore";
import { getAllShopsAsArray } from "../shops.js";
import { updateTaskWithQuery } from "../tasks.js";
import { hostname } from "../../mongo.js";
import { lockProductsForQueryEansOnEby } from "./lockProductsForQueryEansOnEby.js";
import { getUnmatchedQueryEansOnEbyShops } from "./getUnmatchedQueryEansOnEbyShops.js";
import { findArbispotterProducts } from "../crudArbispotterProduct.js";

export async function lookForUnmatchedQueryEansOnEby(
  taskId,
  proxyType,
  action,
  productLimit
) {
  if (action === "recover") {
    const recoveryProducts = await getRecoveryQueryEansOnEby(
      taskId,
      proxyType,
      productLimit
    );
    console.log(
      "Query Eans On Eby:\n",
      recoveryProducts.shops
        .map((info) => `${info.shop.d}: p: ${info.pending}\n`)
        .join("")
    );
    return recoveryProducts;
  } else {
    const pendingShops = await getUnmatchedQueryEansOnEbyShops();
    const stats = pendingShops.reduce((acc, { pending, shop }) => {
      acc[shop.d] = { shopDomain: shop.d, pending, batch: 0 };
      return acc;
    }, {});

    const numberOfShops = pendingShops.length;
    const productsPerShop = Math.round(productLimit / numberOfShops);
    const products = await Promise.all(
      pendingShops.map(async ({ shop, pending }) => {
        const products = await lockProductsForQueryEansOnEby(
          shop.d,
          productsPerShop,
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
      "Query Eans On Eby:\n",
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

export async function getRecoveryQueryEansOnEby(
  taskId,
  proxyType,
  productLimit
) {
  const shops = await getAllShopsAsArray();
  const filteredShops = shops.filter(
    (shop) => (shop.hasEan || shop?.ean) && shop.active
  );
  let pendingShops = [];
  const products = await Promise.all(
    filteredShops.map(async (shop) => {
      const products = await findArbispotterProducts(
        shop.d,
        {
          eby_taskId: `${hostname}:${taskId.toString()}`,
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
