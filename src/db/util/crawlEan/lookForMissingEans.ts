import { shuffle } from "underscore";
import { updateTaskWithQuery } from "../tasks.js";
import { lockProductsForCrawlEan } from "./lockProductsForCrawlEan.js";
import { getMissingEanShops } from "./getMissingEanShops.js";
import { getProductsWithShop } from "../getProductsWithShop.js";
import { ObjectId, ProxyType } from "@dipmaxtech/clr-pkg";
import { Action } from "../../../types/tasks/Tasks.js";
import { PendingShops, PendingShopsWithBatch } from "../../../types/shops.js";
import { log } from "../../../util/logger.js";
import { getRecoveryProducts } from "../multiShopUtilities/getRecoveryProducts.js";

export async function lookForMissingEans(
  taskId: ObjectId,
  proxyType: ProxyType,
  action: Action,
  productLimit: number
) {
  if (action === "recover") {
    const recoveryProducts = await getRecoveryProducts(
      "CRAWL_EAN",
      taskId,
      productLimit,
      proxyType
    );
    log(
      `Missing Eans: ${recoveryProducts.shops
        .map((info) => `${info.shop.d}: p: ${info.pending} `)
        .join("")}`
    );
    return recoveryProducts;
  } else {
    const { pendingShops, shops } = await getMissingEanShops(proxyType);
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
        const products = await lockProductsForCrawlEan(
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

    log(
      `Missing Eans: ${Object.values(stats)
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
