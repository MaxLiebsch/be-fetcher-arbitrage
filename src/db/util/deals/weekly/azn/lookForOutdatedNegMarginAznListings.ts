import { shuffle } from "underscore";
import { updateTaskWithQuery } from "../../../tasks.js";
import { lockProductsForCrawlAznListings } from "../../../crawlAznListings/lockProductsForCrawlAznListings";
import { getOutdatedNegMarginAznListingsPerShop } from "./getOutdatedNegMarginAznListingsPerShop";
import { getRecoveryNegMarginAznListings } from "./getRecoveryNegMarginAznListings";
import { getProductsWithShop } from "../../../getProductsWithShop";
import { ObjectId, ProxyType } from "@dipmaxtech/clr-pkg";
import { Action } from "../../../../../types/tasks/Tasks";
import {
  PendingShops,
  PendingShopsWithBatch,
} from "../../../../../types/shops.js";

export async function lookForOutdatedNegMarginAznListings(
  taskId: ObjectId,
  proxyType: ProxyType,
  action: Action,
  productLimit: number
) {
  if (action === "recover") {
    const recoveryProducts = await getRecoveryNegMarginAznListings(
      taskId,
      proxyType,
      productLimit
    );
    console.log(
      "Outdated Negative Margin Azn:\n",
      recoveryProducts.shops
        .map((info) => `${info.shop.d}: p: ${info.pending}\n`)
        .join("")
    );
    return recoveryProducts;
  } else {
    const { pendingShops, shops } =
      await getOutdatedNegMarginAznListingsPerShop(proxyType);
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
        const products = await lockProductsForCrawlAznListings(
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

    console.log(
      "Outdated Negative Margin Azn:\n",
      Object.values(stats)
        .map((stat) => `${stat.shop}: p: ${stat.pending} b: ${stat?.batch}\n`)
        .join("")
    );

    await updateTaskWithQuery({ _id: taskId }, { progress });

    return {
      products: shuffle(products).flatMap((ps) => ps),
      shops: pendingShops,
    };
  }
}
