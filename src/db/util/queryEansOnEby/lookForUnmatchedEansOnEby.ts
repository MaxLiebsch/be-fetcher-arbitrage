import { shuffle } from "underscore";
import { updateTaskWithQuery } from "../tasks";
import { lockProductsForQueryEansOnEby } from "./lockProductsForQueryEansOnEby";
import { getUnmatchedQueryEansOnEbyShops } from "./getUnmatchedQueryEansOnEbyShops";
import { getRecoveryQueryEansOnEby } from "./getRecoveryQueryEansOnEby";
import { getProductsWithShop } from "../getProductsWithShop";
import { ObjectId } from "@dipmaxtech/clr-pkg";
import { Action } from "../../../types/tasks/Tasks";
import { PendingShops, PendingShopsWithBatch } from "../../../types/shops";
import { log } from "../../../util/logger";

export async function lookForUnmatchedQueryEansOnEby(
  taskId: ObjectId,
  action: Action,
  productLimit: number
) {
  if (action === "recover") {
    const recoveryProducts = await getRecoveryQueryEansOnEby(
      taskId,
      productLimit
    );
    log(
      `Query Eans On Eby: ${recoveryProducts.shops
        .map((info) => `${info.shop.d}: p: ${info.pending} `)
        .join("")}`
    );
    return recoveryProducts;
  } else {
    const { pendingShops, shops } = await getUnmatchedQueryEansOnEbyShops();
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
        const products = await lockProductsForQueryEansOnEby(
          shop.d,
          productsPerShop,
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
    log(
      `Query Eans On Eby: ${Object.values(stats)
        .map((stat) => `${stat.shop.d}: p: ${stat.pending} b: ${stat?.batch} `)
        .join("")}`
    );
    
    await updateTaskWithQuery({ _id: taskId }, { progress });

    return {
      products: shuffle(products).flatMap((ps) => ps),
      shops: pendingShops,
    };
  }
}
