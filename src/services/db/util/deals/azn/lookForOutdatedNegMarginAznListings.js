import { shuffle } from "underscore";
import { getAllShopsAsArray } from "../../shops.js";
import { updateTaskWithQuery } from "../../tasks.js";
import { findArbispotterProducts } from "../../crudArbispotterProduct.js";
import { recoveryCrawlAznListingsQuery} from "../../queries.js";
import { lockProductsForCrawlAznListings } from "../../crawlAznListings/lockProductsForCrawlAznListings.js";
import { getOutdatedNegMarginAznListingsPerShop } from "./getOutdatedNegMarginAznListingsPerShop.js";
import { shopProxyTypeFilter } from "../../filter.js";

export async function lookForOutdatedNegMarginAznListings(
  taskId,
  proxyType,
  action,
  productLimit
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
    const pendingShops = await getOutdatedNegMarginAznListingsPerShop(
      proxyType
    );
    const stats = pendingShops.reduce((acc, { pending, shop }) => {
      acc[shop.d] = { shopDomain: shop.d, pending, batch: 0 };
      return acc;
    }, {});

    const numberOfShops = pendingShops.length;
    const productsPerShop = Math.round(productLimit / numberOfShops);

    const products = await Promise.all(
      pendingShops.map(async ({ shop, pending }) => {
        const limit = Math.min(pending, productsPerShop);
        const products = await lockProductsForCrawlAznListings(
          shop.d,
          limit,
          action,
          taskId
        );

        const productsWithShop = products.map((product) => {
          return { shop, product };
        });
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
      "Outdated Negative Margin Azn:\n",
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

export async function getRecoveryNegMarginAznListings(taskId, proxyType, productLimit) {
  const shops = await getAllShopsAsArray();
  const filteredShops = shops.filter((shop) =>
    shopProxyTypeFilter(shop, proxyType)
  );
  let pendingShops = [];
  const products = await Promise.all(
    filteredShops.map(async (shop) => {
      const products = await findArbispotterProducts(
        shop.d,
        recoveryCrawlAznListingsQuery(taskId),
        productLimit
      );
      if (products.length > 0) {
        pendingShops.push({ shop, pending: products.length });
      }
      const productsWithShop = products.map((product) => {
        return { shop, product };
      });
      return productsWithShop;
    })
  );
  return {
    products: shuffle(products).flatMap((ps) => ps),
    shops: pendingShops,
  };
}
