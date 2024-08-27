import { shuffle } from "underscore";
import { updateTaskWithQuery } from "../../../tasks.js";
import { lockProductsForDealsOnEby } from "./lockProductsForDealsOnEby.js";
import { getOutdatedDealsOnEbyShops } from "./getOutdatedDealsOnEbyShops.js";
import { getRecoveryDealsOnEby } from "./getRecoveryDealsOnEby.js";
import { getProductsWithShop } from "../../../getProductsWithShop.js";

export async function lookForOutdatedDealsOnEby(
  taskId,
  proxyType,
  action,
  productLimit
) {
  if (action === "recover") {
    const recoveryProducts = await getRecoveryDealsOnEby(
      taskId,
      proxyType,
      productLimit
    );
    console.log(
      "Deals On Eby:\n",
      recoveryProducts.shops
        .map((info) => `${info.shop.d}: p: ${info.pending}\n`)
        .join("")
    );
    return recoveryProducts;
  } else {
    const {pendingShops, shops} = await getOutdatedDealsOnEbyShops(proxyType);
    const stats = pendingShops.reduce((acc, { pending, shop }) => {
      acc[shop.d] = { shopDomain: shop.d, pending, batch: 0 };
      return acc;
    }, {});

    const numberOfShops = pendingShops.length;
    const productsPerShop = Math.round(productLimit / numberOfShops);
    const products = await Promise.all(
      pendingShops.map(async ({ shop, pending }) => {
        const products = await lockProductsForDealsOnEby(
          shop.d,
          productsPerShop,
          action,
          taskId
        );

        const productsWithShop = getProductsWithShop(products, shop, shops)
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
      "Deals On Eby:\n",
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


