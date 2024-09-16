import { shuffle } from "underscore";
import { updateTaskWithQuery } from "../../../tasks";
import { getOutdatedNegMarginEbyListingsPerShop } from "./getOutdatedNegMarginEbyListingsPerShop";
import { lockProductsForCrawlEbyListings } from "../../../crawlEbyListings/lockProductsForCrawlEbyListings";
import { getRecoveryNegMarginEbyListings } from "./getRecoveryNegMarginEbyListings";
import { getProductsWithShop } from "../../../getProductsWithShop";
import { ObjectId, ProxyType } from "@dipmaxtech/clr-pkg";
import { Action } from "../../../../../types/tasks/Tasks";
import {
  PendingShops,
  PendingShopsWithBatch,
} from "../../../../../types/shops";
import { log } from "../../../../../util/logger";

export async function lookForOudatedNegMarginEbyListings(
  taskId: ObjectId,
  proxyType: ProxyType,
  action: Action,
  productLimit: number
) {
  if (action === "recover") {
    const recoveryProducts = await getRecoveryNegMarginEbyListings(
      taskId,
      proxyType,
      productLimit
    );
    log(
      `Neg Eby Listings: ${recoveryProducts.shops
        .map((info) => `${info.shop.d}: p: ${info.pending} `)
        .join("")}`
    );
    return recoveryProducts;
  } else {
    const { pendingShops, shops } =
      await getOutdatedNegMarginEbyListingsPerShop(proxyType);
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
        const products = await lockProductsForCrawlEbyListings(
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
      `Neg Eby Listings: ${Object.values(stats)
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
