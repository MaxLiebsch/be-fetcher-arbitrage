import { shuffle } from "underscore";
import { ObjectId } from "@dipmaxtech/clr-pkg";
import { getMissingEbyCategoryShops } from "./getMissingEbyCategoryShops.js";
import { lockProductsForLookupCategory } from "./lockProductsForLookupCategory.js";
import { getRecoveryLookupCategory } from "./getRecoveryLookupCategory.js";
import { updateTaskWithQuery } from "../tasks.js";
import { getProductsWithShop } from "../getProductsWithShop.js";
import { Action } from "../../../types/tasks/Tasks.js";
import { PendingShops, PendingShopsWithBatch } from "../../../types/shops.js";

export async function lookForMissingEbyCategory(
  taskId: ObjectId,
  action: Action,
  productLimit: number
) {
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
    const { pendingShops, shops } = await getMissingEbyCategoryShops();
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
        const limit = Math.min(pending, productsPerShop);
        const products = await lockProductsForLookupCategory(
          shop.d,
          limit,
          action,
          taskId
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
      "Missing Category:\n",
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
