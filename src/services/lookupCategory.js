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

export const resetEbayProduct = {
  esin: "",
  e_pblsh: false,
  e_uprc: 0,
  e_qty: 0,
  e_prc: 0,
  e_lnk: "",
  e_hash: "",
  e_nm: "",
  e_mrgn: 0,
  e_ns_mrgn: 0,
  e_mrgn_prc: 0,
  ebyCategories: [],
  e_ns_mrgn_prc: 0,
};

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

    const { products: crawlDataProducts, shops } =
      await lookForMissingEbyCategory(_id, proxyType, action, productLimit);

    shops.forEach(async (info) => {
      await createArbispotterCollection(info.shop.d);
      infos.shops[info.shop.d] = 0;
    });

    if (!crawlDataProducts.length)
      return reject(new MissingProductsError(`No products ${type}`, task));

    const _productLimit =
      crawlDataProducts.length < productLimit
        ? crawlDataProducts.length
        : productLimit;
    task.actualProductLimit = _productLimit;

    infos.locked = crawlDataProducts.length;

    await updateProgressInLookupCategoryTask(proxyType); // update lookup category task

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
          await updateProgressInLookupCategoryTask(proxyType); // update lookup category task
          handleResult(r, resolve, reject);
        }),
      DEFAULT_CHECK_PROGRESS_INTERVAL
    );

    for (let index = 0; index < crawlDataProducts.length; index++) {
      let { shop: srcShop, product } = crawlDataProducts[index];

      const crawledProductLink = product.link;

      const queryUrl = "https://www.ebay.de/itm/" + product.esin;

      const shopDomain = srcShop.d;

      const addProduct = async (product) => {};
      const addProductInfo = async ({ productInfo, url }) => {
        infos.shops[shopDomain]++;
        infos.total++;
        queue.total++;
        if (productInfo) {
          const infoMap = new Map();
          productInfo.forEach((info) => infoMap.set(info.key, info.value));
          const crawlDataProductUpdate = {
            cat_locked: false,
            cat_prop: "complete",
            cat_taskId: "",
          };
          const ean = infoMap.get("ean");
          const ebyListingPrice = infoMap.get("e_prc");
          const categories = infoMap.get("categories");

          if (srcShop.hasEan || srcShop?.ean) {
            if (!ean) {
              await updateCrawlDataProduct(shopDomain, crawledProductLink, {
                cat_locked: false,
                cat_prop: "ean_missing",
                cat_taskId: "",
                esin: "",
              });
              await updateArbispotterProduct(
                shopDomain,
                crawledProductLink,
                resetEbayProduct
              );
            } else if (ean !== product.ean) {
              await updateCrawlDataProduct(shopDomain, crawledProductLink, {
                cat_locked: false,
                cat_prop: "ean_missmatch",
                cat_taskId: "",
                esin: "",
                e_qty: 0,
              });
              await updateArbispotterProduct(
                shopDomain,
                crawledProductLink,
                resetEbayProduct
              );
            } else {
              await handleCategoryAndUpdate(
                shopDomain,
                crawledProductLink,
                product,
                ebyListingPrice,
                categories,
                crawlDataProductUpdate
              );
            }
          } else {
            await handleCategoryAndUpdate(
              shopDomain,
              crawledProductLink,
              product,
              ebyListingPrice,
              categories,
              crawlDataProductUpdate
            );
          }
        } else {
          await updateCrawlDataProduct(shopDomain, crawledProductLink, {
            cat_locked: false,
            cat_prop: "missing",
            cat_taskId: "",
            esin: "",
            e_qty: 0,
          });
        }
        if (infos.total === _productLimit && !queue.idle()) {
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
      };
      const handleNotFound = async (cause) => {
        infos.notFound++;
        infos.shops[shopDomain]++;
        infos.total++;
        queue.total++;
        if (cause === "timeout") {
          await updateCrawlDataProduct(shopDomain, crawledProductLink, {
            cat_locked: false,
            cat_prop: "timeout",
            cat_taskId: "",
          });
        } else {
          await moveCrawledProduct(shopDomain, "grave", crawledProductLink);
          await moveArbispotterProduct(shopDomain, "grave", crawledProductLink);
        }
        if (infos.total === _productLimit && !queue.idle()) {
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
  crawledProductLink,
  crawlDataProduct,
  ebyListingPrice,
  categories,
  crawlDataProductUpdate
) => {
  const {
    esin,
    price: buyPrice,
    e_qty: sellQty,
    qty: buyQty,
  } = crawlDataProduct;
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
      await updateArbispotterProduct(shopDomain, crawledProductLink, {
        ...ebyArbitrage,
        e_prc: sellPrice,
        e_uprc: sellUnitPrice,
        ebyCategories: [
          {
            id: mappedCategory.id,
            createdAt: new Date().toISOString(),
            category: mappedCategory.category,
          },
        ],
        e_pblsh: true,
        esin,
      });
      delete crawlDataProduct._id;
      crawlDataProductUpdate["ebyCategories"] = [
        {
          id: mappedCategory.id,
          createdAt: new Date().toISOString(),
          category: mappedCategory.category,
        },
      ];
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
        esin: "",
        e_qty: 0,
      });
    }
  } else {
    await updateCrawlDataProduct(shopDomain, crawledProductLink, {
      cat_locked: false,
      cat_prop: "categories_missing",
      cat_taskId: "",
      esin: "",
      e_qty: 0,
    });
  }
};

export default lookupCategory;
