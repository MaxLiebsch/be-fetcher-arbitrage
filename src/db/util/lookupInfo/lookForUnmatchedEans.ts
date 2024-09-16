import { ObjectId } from "@dipmaxtech/clr-pkg";
import { shuffle } from "underscore";

import { lockProductsForLookupInfo } from "./lockProductsForLookupInfo.js";
import { getUnmatchedEanShops } from "./getUnmatchedEanShops.js";
import { getRecoveryLookupInfoProducts } from "./getRecoveryLookupInfoProducts.js";
import { updateTaskWithQuery } from "../tasks.js";
import { getProductsWithShop } from "../getProductsWithShop.js";
import { Action } from "../../../types/tasks/Tasks.js";
import { PendingShops, PendingShopsWithBatch } from "../../../types/shops.js";

export async function lookForUnmatchedEans(
  taskId: ObjectId,
  action: Action,
  productLimit: number
) {
  if (action === "recover") {
    const recoveryProducts = await getRecoveryLookupInfoProducts(
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
    const { pendingShops, shops } = await getUnmatchedEanShops();
    const stats = pendingShops.reduce<PendingShopsWithBatch>(
      (acc, { pending, shop }) => {
        acc[shop.d] = { shop, pending, batch: 0 };
        return acc;
      },
      {}
    );

    const numberOfShops = pendingShops.length;
    const productsPerShop = Math.round(productLimit / numberOfShops);

    const products = await Promise.all(
      pendingShops.map(async ({ shop, pending }) => {
        const products = await lockProductsForLookupInfo(
          shop.d,
          productsPerShop,
          action,
          taskId,
          Boolean(shop.hasEan || shop?.ean)
        );

        const productsWithShop = getProductsWithShop(products, shop, shops);
        stats[shop.d].batch = productsWithShop.length;
        return productsWithShop;
      })
    );

    const progress = pendingShops.reduce<PendingShops>(
      (acc, { shop, pending }) => {
        acc.push({
          shop,
          pending,
        });
        return acc;
      },
      []
    );

    console.log(
      "Lookup Info:\n",
      Object.values(stats)
        .map((stat) => `${stat.shop.d}: p: ${stat.pending} b: ${stat?.batch}\n`)
        .join("")
    );

    await updateTaskWithQuery({ _id: taskId }, { progress });

    return {
      products: shuffle(products).flatMap((ps) => ps),
      shops: pendingShops,
    };
  }
}
