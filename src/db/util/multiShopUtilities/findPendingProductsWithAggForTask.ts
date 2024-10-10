import { ObjectId } from "@dipmaxtech/clr-pkg";
import { shuffle } from "underscore";
import { Action } from "../../../types/tasks/Tasks.js";
import { getRecoveryProducts } from "./getRecoveryProducts.js";
import { MultiShopTaskTypesWithAgg } from "../../../util/taskTypes.js";
import { log } from "../../../util/logger.js";
import { PendingShops, PendingShopsWithBatch } from "../../../types/shops.js";
import { findPendingShopsWithAgg } from "./findPendingShopsWithAgg.js";
import { getProductsWithShop } from "../getProductsWithShop.js";
import { updateTaskWithQuery } from "../tasks.js";
import { lockProductsWithAgg } from "./lockProducts.js";

export async function findPendingProductsWithAggForTask(
  taskType: MultiShopTaskTypesWithAgg,
  taskId: ObjectId,
  action: Action,
  productLimit: number
) {
  if (action === "recover") {
    const recoveryProducts = await getRecoveryProducts(
      taskType,
      taskId,
      productLimit
    );
    log(
      `${taskType}: ${recoveryProducts.shops
        .map((info) => `${info.shop.d}: p: ${info.pending} `)
        .join("")}`
    );
    return recoveryProducts;
  } else {
    const { pendingShops, shops } = await findPendingShopsWithAgg(taskType);
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
        const products = await lockProductsWithAgg(
          taskType,
          shop.d,
          limit,
          taskId,
          action
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
      `${taskType}: ${Object.values(stats)
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
