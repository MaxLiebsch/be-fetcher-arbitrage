import { shuffle } from "underscore";
import { updateTaskWithQuery } from "../tasks.js";
import { getProductsWithShop } from "../getProductsWithShop.js";
import { ObjectId } from "@dipmaxtech/clr-pkg";
import { Action } from "../../../types/tasks/Tasks.js";
import { PendingShops, PendingShopsWithBatch } from "../../../types/shops.js";
import { log } from "../../../util/logger.js";
import { getRecoveryProducts } from "../multiShopUtilities/getRecoveryProducts.js";
import { lockProducts } from "../multiShopUtilities/lockProducts.js";
import { findPendingShops } from "./findPendingShops.js";
import { MultiShopTaskTypesWithQuery } from "../../../util/taskTypes.js";

export async function findPendingProductsForTask(
  taskType: MultiShopTaskTypesWithQuery,
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
      `Missing ${taskType}: ${recoveryProducts.shops
        .map((info) => `${info.shop.d}: p: ${info.pending} `)
        .join("")}`
    );
    return recoveryProducts;
  } else {
    const { pendingShops, shops } = await findPendingShops(taskType);
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
        const products = await lockProducts(
          taskType,
          shop.d,
          limit,
          action,
          taskId,
          Boolean(shop.ean || shop.hasEan)
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
      `Missing ${taskType}: ${Object.values(stats)
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
