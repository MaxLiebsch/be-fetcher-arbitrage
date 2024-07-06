import {
  QueryQueue,
  calculateEbyArbitrage,
  parseEbyCategories,
  queryProductPageQueue,
  safeParsePrice,
} from "@dipmaxtech/clr-pkg";
import _ from "underscore";

import { handleResult } from "../handleResult.js";
import { MissingProductsError } from "../errors.js";
import {
  CONCURRENCY,
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  proxyAuth,
} from "../constants.js";
import { checkProgress } from "../util/checkProgress.js";
import {
  moveCrawledProduct,
  updateCrawlDataProduct,
} from "./db/util/crudCrawlDataProduct.js";
import {
  moveArbispotterProduct,
  updateArbispotterProduct,
} from "./db/util/crudArbispotterProduct.js";
import { updateProgressInLookupCategoryTask } from "../util/updateProgressInTasks.js";
import { lookForMissingEbyCategory } from "./db/util/lookupCategory/lookForMissingEbyCategory.js";
import { getShop } from "./db/util/shops.js";
import { createArbispotterCollection } from "./db/mongo.js";

async function lookupCategory(task) {
  return new Promise(async (resolve, reject) => {
    const { productLimit, _id, action, proxyType, type } = task;

    let infos = {
      new: 0,
      total: 0,
      old: 0,
      notFound: 0,
      locked: 0,
      shops: {},
    };

    const { products, shops } = await lookForMissingEbyCategory(
      _id,
      proxyType,
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

    infos.locked = products.length;

    await updateProgressInLookupCategoryTask(proxyType); // update lookup category task

    const startTime = Date.now();

    const toolInfo = await getShop("ebay.de");

    const queue = new QueryQueue(
      task?.concurrency ? task.concurrency : CONCURRENCY,
      proxyAuth,
      task
    );
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
          await updateProgressInLookupCategoryTask(proxyType); // update lookup category task
          handleResult(r, resolve, reject);
        }),
      DEFAULT_CHECK_PROGRESS_INTERVAL
    );

    for (let index = 0; index < products.length; index++) {
      const { shop, product } = products[index];

      const crawledProductLink = product.link;

      const queryUrl = "https://www.ebay.de/itm/" + product.esin;

      const shopDomain = shop.d;

      const addProduct = async (product) => {};
      const addProductInfo = async ({ productInfo, url }) => {
        if (productInfo) {
          const infoMap = new Map();
          productInfo.forEach((info) => infoMap.set(info.key, info.value));
          const crawlDataProductUpdate = {
            cat_locked: false,
            cat_prop: "complete",
            cat_taskId: "",
          };
          const ean = infoMap.get("ean");
          const price = infoMap.get("price");
          const categories = infoMap.get("categories");
          if (categories) {
            const sellPrice = safeParsePrice(price ?? "0");
            const parsedCategories = parseEbyCategories(categories);
            let ebyArbitrage = calculateEbyArbitrage(
              parsedCategories,
              sellPrice,
              product.price
            );
            if (ebyArbitrage) {
              await updateArbispotterProduct(shopDomain, crawledProductLink, {
                ...ebyArbitrage,
                e_pblsh: true,
                ebyCategories: parsedCategories,
                esin: product.esin,
              });
              delete product._id;
              crawlDataProductUpdate["ebyCategories"] = parsedCategories;
              crawlDataProductUpdate["ebyUpdatedAt"] = new Date().toISOString();

              await updateCrawlDataProduct(
                shopDomain,
                crawledProductLink,
                crawlDataProductUpdate
              );
            } else {
              await updateCrawlDataProduct(shopDomain, crawledProductLink, {
                cat_locked: false,
                cat_prop: "category_not_found",
                cat_taskId: "",
              });
            }
          } else {
            await updateCrawlDataProduct(shopDomain, crawledProductLink, {
              cat_locked: false,
              cat_prop: "categories_missing",
              cat_taskId: "",
            });
          }
        } else {
          await updateCrawlDataProduct(shopDomain, crawledProductLink, {
            cat_locked: false,
            cat_prop: "missing",
            cat_taskId: "",
          });
        }
        if (infos.total >= _productLimit - 1 && !queue.idle()) {
          await checkProgress({
            queue,
            infos,
            startTime,
            productLimit: _productLimit,
          }).catch(async (r) => {
            clearInterval(interval);
            await updateProgressInLookupCategoryTask(proxyType); // update lookup category task
            handleResult(r, resolve, reject);
          });
        }
        infos.shops[shopDomain]++;
        infos.total++;
      };
      const handleNotFound = async (cause) => {
        infos.notFound++;
        if (cause === "timeout") {
          await updateCrawlDataProduct(shopDomain, crawledProductLink, {
            cat_locked: false,
            cat_prop: "timeout",
            cat_taskId: "",
          });
        } else {
          await moveCrawledProduct(shopDomain, "grave", crawledProductLink);
          await moveArbispotterProduct(shopDomain, "grave", crawledProductLink);
          if (infos.total >= _productLimit - 1 && !queue.idle()) {
            await checkProgress({
              queue,
              infos,
              startTime,
              productLimit: _productLimit,
            }).catch(async (r) => {
              clearInterval(interval);
              await updateProgressInLookupCategoryTask(proxyType); // update lookup category task
              handleResult(r, resolve, reject);
            });
          }
        }
        infos.shops[shopDomain]++;
        infos.total++;
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
        query: {},
        prio: 0,
        extendedLookUp: false,
        limit: undefined,
        prodInfo: undefined,
        isFinished: undefined,
        pageInfo: {
          link: queryUrl,
          name: shop.d,
        },
      });
    }
  });
}

export default lookupCategory;
