import { shuffle } from "underscore";
import { updateTaskWithQuery } from "../tasks.js";
import { getMissingEbyCategoryShops } from "./getMissingEbyCategoryShops.js";
import { lockProductsForLookupCategory } from "./lockProductsForLookupCategory.js";
import { getRecoveryLookupCategory } from "./getRecoveryLookupCategory.js";
import { getProductsWithShop } from "../getProductsWithShop.js";

export async function lookForMissingEbyCategory(taskId, action, productLimit) {
  if (action === "recover") {
    const recoveryProducts = await getRecoveryLookupCategory(
      taskId,
      productLimit
    );
    console.log(
      "Missing Category:\n",
      recoveryProducts.shops
        .map((info) => `${info.shop.d}: p: ${info.pending}\n`)
        .join("")
    );
    return recoveryProducts;
  } else {
    const {pendingShops, shops} = await getMissingEbyCategoryShops();
    const stats = pendingShops.reduce((acc, { pending, shop }) => {
      acc[shop.d] = { shopDomain: shop.d, pending, batch: 0 };
      return acc;
    }, {});

    const numberOfShops = pendingShops.length;
    const productsPerShop = Math.round(productLimit / numberOfShops);

    const products = await Promise.all(
      pendingShops.map(async ({ shop, pending }) => {
        const limit = Math.min(pending, productsPerShop);
        const products = await lockProductsForLookupCategory(
          shop.d,
          limit,
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
      "Missing Category:\n",
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

