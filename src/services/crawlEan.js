import {
  QueryQueue,
  deliveryTime,
  queryProductPageQueue,
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
import { lookForMissingEans } from "./db/util/crawlEan/lookForMissingEans.js";
import { updateProgressInMatchTasks } from "../util/updateProgressInMatchTasks.js";
import {
  deleteArbispotterProduct,
  insertArbispotterProduct,
  moveArbispotterProduct,
  updateArbispotterProductSet,
} from "./db/util/crudArbispotterProduct.js";
import { createHash } from "../util/hash.js";
import {
  updateProgressInCrawlEanTask,
  updateProgressInLookupInfoTask,
  updateProgressInQueryEansOnEbyTask,
} from "../util/updateProgressInTasks.js";

export default async function crawlEan(task) {
  return new Promise(async (resolve, reject) => {
    const { productLimit, _id, action, proxyType, type } = task;

    let infos = {
      total: 1,
      notFound: 0,
      locked: 0,
      shops: {},
      missingProperties: {},
    };

    const { products, shops } = await lookForMissingEans(
      _id,
      proxyType,
      action,
      productLimit
    );

    shops.forEach((info) => {
      infos.shops[info.shop.d] = 0;
      infos.missingProperties[info.shop.d] = {
        ean: 0,
        image: 0,
      };
    });

    if (!products.length)
      return reject(new MissingProductsError(`No products ${type}`, task));

    const _productLimit =
      products.length < productLimit ? products.length : productLimit;
    task.actualProductLimit = _productLimit;

    infos.locked = products.length;

    //Update task progress
    await updateProgressInCrawlEanTask(proxyType); // update crawl ean task

    const startTime = Date.now();

    const queue = new QueryQueue(
      task?.concurrency ? task.concurrency : CONCURRENCY,
      proxyAuth,
      task
    );
    queue.total = 1;
    await queue.connect();

    const isComplete = async () => {
      if (infos.total === _productLimit && !queue.idle()) {
        await checkProgress({
          queue,
          infos,
          startTime,
          productLimit: _productLimit,
        }).catch(async (r) => {
          clearInterval(interval);
          await Promise.all([
            updateProgressInCrawlEanTask(proxyType), // update crawl ean task
            updateProgressInMatchTasks(shops), // update matching tasks
            updateProgressInLookupInfoTask(), // update lookup info task
            updateProgressInQueryEansOnEbyTask(), // update query eans on eby task
          ]);
          handleResult(r, resolve, reject);
        });
      }
    };

    const interval = setInterval(
      async () =>
        await checkProgress({
          queue,
          infos,
          startTime,
          productLimit: _productLimit,
        }).catch(async (r) => {
          clearInterval(interval);
          await Promise.all([
            updateProgressInCrawlEanTask(proxyType), // update crawl ean task
            updateProgressInMatchTasks(shops), // update matching tasks
            updateProgressInLookupInfoTask(), // update lookup info task
            updateProgressInQueryEansOnEbyTask(), // update query eans on eby task
          ]);
          handleResult(r, resolve, reject);
        }),
      DEFAULT_CHECK_PROGRESS_INTERVAL
    );

    for (let index = 0; index < products.length; index++) {
      const { shop, product } = products[index];
      let { lnk: productLink } = product;

      const shopDomain = shop.d;

      const addProduct = async (product) => {};
      const addProductInfo = async ({ productInfo, url }) => {
        infos.shops[shopDomain]++;
        infos.total++;
        queue.total++;
        if (productInfo) {
          const infoMap = new Map();
          productInfo.forEach((info) => infoMap.set(info.key, info.value));
          let ean = infoMap.get("ean");
          let isEan =
            ean &&
            /\b[0-9]{12,13}\b/.test(ean) &&
            !ean.toString().startsWith("99");

          if (isEan) {
            const prc = safeParsePrice(infoMap.get("price") ?? 0);
            const sku = infoMap.get("sku");
            const image = infoMap.get("image");
            const mku = infoMap.get("mku");
            const inStock = infoMap.get("instock");

            const productUpdate = {
              ean_taskId: "",
              eanUpdatedAt: new Date().toISOString(),
              ean_prop: "found",
              ean,
              ...(prc && { prc }),
              ...(image && { img: image }),
              ...(sku && { sku }),
              ...(mku && { mku }),
            };
            if (inStock) {
              const stockStr = deliveryTime(inStock);
              if (stockStr) {
                productUpdate["a"] = stockStr;
              }
            }

            if (url === productLink) {
              await updateArbispotterProductSet(
                shopDomain,
                productLink,
                productUpdate
              );
            } else {
              const result = await deleteArbispotterProduct(
                shopDomain,
                productLink
              );
              if (result.deletedCount === 1) {
                const s_hash = createHash(url);
                await insertArbispotterProduct(shopDomain, {
                  ...product,
                  ...productUpdate,
                  lnk: url,
                  s_hash,
                });
              }
            }
          } else {
            infos.missingProperties[shopDomain]["ean"]++;
            const productUpdate = {
              ean_taskId: "",
              eanUpdatedAt: new Date().toISOString(),
              ean_prop: ean ? "invalid" : "missing",
            };
            await updateArbispotterProductSet(
              shopDomain,
              productLink,
              productUpdate
            );
          }
        } else {
          await updateArbispotterProductSet(shopDomain, productLink, {
            ean_prop: "invalid",
            eanUpdatedAt: new Date().toISOString(),
            ean_taskId: "",
          });
        }
        await isComplete();
      };
      const handleNotFound = async (cause) => {
        infos.notFound++;
        infos.shops[shopDomain]++;
        infos.total++;
        queue.total++;
        if (cause === "timeout") {
          await updateArbispotterProductSet(shopDomain, productLink, {
            ean_prop: "timeout",
            eanUpdatedAt: new Date().toISOString(),
            ean_taskId: "",
          });
        } else {
          await moveArbispotterProduct(shopDomain, "grave", productLink);
        }
        await isComplete();
      };

      queue.pushTask(queryProductPageQueue, {
        retries: 0,
        shop,
        addProduct,
        targetShop: {
          name: shopDomain,
          prefix: "",
          d: shopDomain,
        },
        onNotFound: handleNotFound,
        addProductInfo,
        queue,
        query: defaultQuery,
        prio: 0,
        extendedLookUp: false,
        pageInfo: {
          link: productLink,
          name: shop.d,
        },
      });
    }
  });
}
