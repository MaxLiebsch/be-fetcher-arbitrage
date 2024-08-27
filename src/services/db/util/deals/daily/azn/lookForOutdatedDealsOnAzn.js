import { shuffle } from "underscore";
import { updateTaskWithQuery } from "../../../tasks.js";
import { lockProductsForDealsOnAzn } from "./lockProductsForDealsOnAzn.js";
import { getOutdatedDealsOnAznShops } from "./getOutdatedDealsOnAznShops.js";
import { getRecoveryDealsOnAzn } from "./getRecoveryDealsOnAzn.js";
import { getProductsWithShop } from "../../../getProductsWithShop.js";

export async function lookForOutdatedDealsOnAzn(
  taskId,
  proxyType,
  action,
  productLimit
) {
  if (action === "recover") {
    const recoveryProducts = await getRecoveryDealsOnAzn(
      taskId,
      proxyType,
      productLimit
    );
    console.log(
      "Deals on Azn:\n",
      recoveryProducts.shops
        .map((info) => `${info.shop.d}: p: ${info.pending}\n`)
        .join("")
    );
    return recoveryProducts;
  } else {
    const {pendingShops, shops} = await getOutdatedDealsOnAznShops(proxyType);
    const stats = pendingShops.reduce((acc, { pending, shop }) => {
      acc[shop.d] = { shopDomain: shop.d, pending, batch: 0 };
      return acc;
    }, {});

    const numberOfShops = pendingShops.length;
    console.log('numberOfShops:', numberOfShops)
    const productsPerShop = Math.round(productLimit / numberOfShops);
    console.log('productsPerShop:', productsPerShop)
    const products = await Promise.all(
      pendingShops.map(async ({ shop, pending }) => {
        const products = await lockProductsForDealsOnAzn(
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
      "Deals on Azn:\n",
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

