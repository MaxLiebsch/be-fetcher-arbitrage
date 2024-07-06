import { QueryQueue, queryProductPageQueue } from "@dipmaxtech/clr-pkg";
import _ from "underscore";

import { handleResult } from "../handleResult.js";
import { MissingProductsError } from "../errors.js";
import {
  CONCURRENCY,
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  proxyAuth,
} from "../constants.js";
import { checkProgress } from "../util/checkProgress.js";
import { lookForMissingEans } from "./db/util/crawlEan/lookForMissingEans.js";
import {
  deleteProduct,
  moveCrawledProduct,
  updateCrawlDataProduct,
} from "./db/util/crudCrawlDataProduct.js";
import { updateProgressInMatchTasks } from "../util/updateProgressInMatchTasks.js";
import { moveArbispotterProduct } from "./db/util/crudArbispotterProduct.js";
import { createHash } from "../util/hash.js";
import { subDateDaysISO } from "../util/dates.js";
import {
  updateProgressInCrawlEanTask,
  updateProgressInLookupInfoTask,
  updateProgressInQueryEansOnEbyTask,
} from "../util/updateProgressInTasks.js";
import { createOrUpdateCrawlDataProduct } from "./db/util/createOrUpdateCrawlDataProduct.js";

export default async function crawlEan(task) {
  return new Promise(async (resolve, reject) => {
    const { productLimit, _id, action, proxyType, type } = task;

    let infos = {
      total: 0,
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
        hashes: [],
      };
    });

    if (!products.length)
      return reject(new MissingProductsError(`No products ${type}`, task));

    const _productLimit =
      products.length < productLimit ? products.length : productLimit;

    infos.locked = products.length;

    //Update task progress
    await updateProgressInCrawlEanTask(proxyType); // update crawl ean task

    const startTime = Date.now();

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
      let crawlDataProductLink = product.link;
      const shopDomain = shop.d;

      const addProduct = async (product) => {};
      const addProductInfo = async ({ productInfo, url }) => {
        if (productInfo) {
          const infoMap = new Map();
          productInfo.forEach((info) => infoMap.set(info.key, info.value));
          const crawlDataProductUpdate = {
            ean_locked: false,
            ean_taskId: "",
          };
          let ean = infoMap.get("ean");
          let isEan =
            ean &&
            /\b[0-9]{12,13}\b/.test(ean) &&
            !ean.toString().startsWith("99");

          if (ean && Number(ean) && ean.length === 11) {
            ean = "00" + ean;
            isEan = true;
          }

          const sku = infoMap.get("sku");
          const image = infoMap.get("image");
          const mku = infoMap.get("mku");
          if (url !== crawlDataProductLink) {
            await deleteProduct(shopDomain, crawlDataProductLink);
            crawlDataProductLink = url;
            crawlDataProductUpdate["link"] = url;
          }
          if (isEan) {
            crawlDataProductUpdate["ean"] = ean;
          }
          if (sku) {
            crawlDataProductUpdate["sku"] = sku;
          }
          if (image) {
            crawlDataProductUpdate["image"] = image;
          }
          if (mku) {
            crawlDataProductUpdate["mku"] = mku;
          }
          const properties = ["ean"];
          properties.forEach((prop) => {
            if (!crawlDataProductUpdate[prop]) {
              infos.missingProperties[shopDomain][prop]++;
            }
          });
          crawlDataProductUpdate["s_hash"] = createHash(crawlDataProductLink);
          if (isEan) {
            crawlDataProductUpdate["ean_prop"] = "found";
          } else {
            infos.missingProperties[shopDomain].hashes.push(
              crawlDataProductUpdate["s_hash"]
            );
            crawlDataProductUpdate["ean_prop"] = ean ? "invalid" : "missing";
          }
          delete product._id;
          await createOrUpdateCrawlDataProduct(shopDomain, {
            ...product,
            ...crawlDataProductUpdate,
          });
        } else {
          const crawlDataProductUpdate = {
            ean_locked: false,
            ean_prop: "missing",
            ean_taskId: "",
          };
          await updateCrawlDataProduct(
            shopDomain,
            crawlDataProductLink,
            crawlDataProductUpdate
          );
        }
        if (infos.total >= _productLimit - 1 && !queue.idle()) {
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
        infos.shops[shopDomain]++;
        infos.total++;
      };
      const handleNotFound = async (cause) => {
        infos.notFound++;
        if (cause === "timeout") {
          await updateCrawlDataProduct(shopDomain, crawlDataProductLink, {
            ean_locked: false,
            ean_prop: "timeout",
            ean_taskId: "",
          });
        } else {
          await moveCrawledProduct(shopDomain, "grave", crawlDataProductLink);
          await moveArbispotterProduct(
            shopDomain,
            "grave",
            crawlDataProductLink
          );
          if (infos.total >= _productLimit - 1 && !queue.idle()) {
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
        }
        infos.shops[shopDomain]++;
        infos.total++;
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
        query: {},
        prio: 0,
        extendedLookUp: false,
        pageInfo: {
          link: crawlDataProductLink,
          name: shop.d,
        },
      });
    }
  });
}
