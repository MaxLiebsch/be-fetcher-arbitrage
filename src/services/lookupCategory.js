import {
  QueryQueue,
  calculateEbyArbitrage,
  findMappedCategory,
  parseEbyCategories,
  queryProductPageQueue,
  roundToTwoDecimals,
  safeParsePrice,
} from "@dipmaxtech/clr-pkg";
import _ from "underscore";

import { handleResult } from "../handleResult.js";
import { MissingProductsError } from "../errors.js";
import {
  CONCURRENCY,
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  defaultQuery,
  proxyAuth,
} from "../constants.js";
import { checkProgress } from "../util/checkProgress.js";
import {
  moveArbispotterProduct,
  updateArbispotterProductQuery,
} from "./db/util/crudArbispotterProduct.js";
import { updateProgressInLookupCategoryTask } from "../util/updateProgressInTasks.js";
import { lookForMissingEbyCategory } from "./db/util/lookupCategory/lookForMissingEbyCategory.js";
import { getShop } from "./db/util/shops.js";
import { createArbispotterCollection } from "./db/mongo.js";
import { resetEbyProductQuery } from "./db/util/ebyQueries.js";

async function lookupCategory(task) {
  return new Promise(async (resolve, reject) => {
    const { productLimit, _id, action, proxyType, type } = task;

    let infos = {
      new: 0,
      total: 1,
      old: 0,
      notFound: 0,
      locked: 0,
      shops: {},
    };

    const { products: products, shops } = await lookForMissingEbyCategory(
      _id,
      action,
      productLimit
    );

    shops.forEach(async (info) => {
      await createArbispotterCollection(info.shop.d);
      infos.shops[info.shop.d] = 0;
    });

    if (!products.length)
      return reject(new MissingProductsError(`No products ${type}`, task));

    const _productLimit =
      products.length < productLimit ? products.length : productLimit;
    task.actualProductLimit = _productLimit;

    infos.locked = products.length;

    await updateProgressInLookupCategoryTask(); // update lookup category task

    const startTime = Date.now();

    const toolInfo = await getShop("ebay.de");

    const queue = new QueryQueue(
      task?.concurrency ? task.concurrency : CONCURRENCY,
      proxyAuth,
      task
    );
    queue.total = 1;
    await queue.connect();

    const interval = setInterval(
      async () =>
        await checkProgress({
          queue,
          infos,
          startTime,
          productLimit: _productLimit,
        }).catch(async (r) => {
          clearInterval(interval);
          await updateProgressInLookupCategoryTask(); // update lookup category task
          handleResult(r, resolve, reject);
        }),
      DEFAULT_CHECK_PROGRESS_INTERVAL
    );

    const isProcessComplete = async () => {
      if (infos.total === _productLimit && !queue.idle()) {
        await checkProgress({
          queue,
          infos,
          startTime,
          productLimit: _productLimit,
        }).catch(async (r) => {
          clearInterval(interval);
          await updateProgressInLookupCategoryTask(); // update lookup category task
          handleResult(r, resolve, reject);
        });
      }
    };

    for (let index = 0; index < products.length; index++) {
      let { shop: srcShop, product } = products[index];
      const { lnk: productLink, esin } = product;

      const queryUrl = "https://www.ebay.de/itm/" + esin;

      const shopDomain = srcShop.d;

      const addProduct = async (product) => {};
      const addProductInfo = async ({ productInfo, url }) => {
        infos.shops[shopDomain]++;
        infos.total++;
        queue.total++;
        if (productInfo) {
          const infoMap = new Map();
          productInfo.forEach((info) => infoMap.set(info.key, info.value));
          const ean = infoMap.get("ean");
          const ebyListingPrice = infoMap.get("e_prc");
          const categories = infoMap.get("categories");

          if (srcShop.hasEan || srcShop?.ean) {
            if (!ean) {
              await updateArbispotterProductQuery(
                shopDomain,
                productLink,
                resetEbyProductQuery({ cat_prop: "ean_missing" })
              );
            } else if (ean !== product.ean) {
              await updateArbispotterProductQuery(
                shopDomain,
                productLink,
                resetEbyProductQuery({ cat_prop: "ean_missmatch" })
              );
            } else {
              await handleCategoryAndUpdate(
                shopDomain,
                product,
                ebyListingPrice,
                categories
              );
            }
          } else {
            await handleCategoryAndUpdate(
              shopDomain,
              product,
              ebyListingPrice,
              categories
            );
          }
        } else {
          await updateArbispotterProductQuery(
            shopDomain,
            productLink,
            resetEbyProductQuery({ cat_prop: "missing" })
          );
        }
        await isProcessComplete();
      };
      const handleNotFound = async (cause) => {
        infos.notFound++;
        infos.shops[shopDomain]++;
        infos.total++;
        queue.total++;
        if (cause === "timeout") {
          await updateArbispotterProductQuery(shopDomain, productLink, {
            $set: {
              cat_prop: "timeout",
            },
            $unset: {
              cat_taskId: "",
            },
          });
        } else {
          await moveArbispotterProduct(shopDomain, "grave", productLink);
        }
        await isProcessComplete();
      };

      queue.pushTask(queryProductPageQueue, {
        retries: 0,
        shop: toolInfo,
        addProduct,
        targetShop: {
          name: shopDomain,
          d: shopDomain,
          prefix: "",
        },
        onNotFound: handleNotFound,
        addProductInfo,
        queue,
        query: defaultQuery,
        prio: 0,
        extendedLookUp: false,
        limit: undefined,
        prodInfo: undefined,
        isFinished: undefined,
        pageInfo: {
          link: queryUrl,
          name: srcShop.d,
        },
      });
    }
  });
}

export const handleCategoryAndUpdate = async (
  shopDomain,
  product,
  ebyListingPrice,
  categories
) => {
  const {
    esin,
    price: buyPrice,
    e_qty: sellQty,
    qty: buyQty,
    lnk: productLink,
  } = product;

  if (categories) {
    const sellPrice = safeParsePrice(ebyListingPrice ?? "0");

    const sellUnitPrice = roundToTwoDecimals(sellPrice / sellQty);
    const parsedCategories = parseEbyCategories(categories); // [ 322323, 3223323, 122121  ]
    let mappedCategory = findMappedCategory(parsedCategories); // { category: "Drogerie", id: 322323, ...}

    if (mappedCategory) {
      let ebyArbitrage = calculateEbyArbitrage(
        mappedCategory,
        sellPrice,
        buyPrice * (sellQty / buyQty)
      );
      const productUpdate = {
        ...ebyArbitrage,
        cat_prop: "complete",
        e_prc: sellPrice,
        e_uprc: sellUnitPrice,
        ebyUpdatedAt: new Date().toISOString(),
        ebyCategories: [
          {
            id: mappedCategory.id,
            createdAt: new Date().toISOString(),
            category: mappedCategory.category,
          },
        ],
        e_pblsh: true,
        esin,
      };
      await updateArbispotterProductQuery(shopDomain, productLink, {
        $set: productUpdate,
        $unset: { cat_taskId: "" },
      });
    } else {
      await updateArbispotterProductQuery(
        shopDomain,
        productLink,
        resetEbyProductQuery({ cat_prop: "category_not_found" })
      );
    }
  } else {
    await updateArbispotterProductQuery(
      shopDomain,
      productLink,
      resetEbyProductQuery({ cat_prop: "categories_missing" })
    );
  }
};

export default lookupCategory;
