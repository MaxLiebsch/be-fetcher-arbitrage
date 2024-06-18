import {
  QueryQueue,
  queryProductPageQueue,
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
import { lookForPendingEanLookups } from "./db/util/lookForPendingEanLookups.js";
import {
  moveCrawledProduct,
  updateCrawledProduct,
} from "./db/util/crudCrawlDataProduct.js";
import { updateMatchingTasks } from "../util/updateMatchingTasks.js";

export default async function eanLookup(task) {
  return new Promise(async (resolve, reject) => {
    const { productLimit, _id, action, proxyType, type } = task;

    let infos = {
      new: 0,
      total: 0,
      old: 0,
      notFound: 0,
      locked: 0,
      missingProperties: {
        bsr: 0,
        ean: 0,
        name: 0,
        price: 0,
        link: 0,
        image: 0,
      },
    };

    const { products, shops } = await lookForPendingEanLookups(
      _id,
      proxyType,
      action,
      productLimit
    );

    if (!products.length)
      return reject(new MissingProductsError(`No products ${type}`, task));

    const _productLimit =
      products.length < productLimit ? products.length : productLimit;

    infos.locked = products.length;

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
          await updateMatchingTasks(shops); // update matching tasks
          handleResult(r, resolve, reject);
        }),
      DEFAULT_CHECK_PROGRESS_INTERVAL
    );

    for (let index = 0; index < products.length; index++) {
      const { shop, product } = products[index];
      const link = product.link;
      const shopDomain = shop.d;
      const _id = product._id;

      const addProduct = async (product) => {};
      const addProductInfo = async ({ productInfo, url }) => {
        if (productInfo) {
          const ean = productInfo.find((info) => info.key === "ean");
          const sku = productInfo.find((info) => info.key === "sku");
          const image = productInfo.find((info) => info.key === "image");
          const mku = productInfo.find((info) => info.key === "mku");

          const update = {
            ean_locked: false,
            matched: false,
            matchedAt: new Date(
              Date.now() - 1000 * 60 * 60 * 24 * 7
            ).toISOString(),
            ean_taskId: "",
          };
          if (ean) {
            update["ean"] = ean.value;
          }
          if (sku) {
            update["sku"] = sku.value;
          }
          if (image) {
            update["image"] = image.value;
          }
          if (mku) {
            update["mku"] = mku.value;
          }
          await updateCrawledProduct(shopDomain, link, update);
        } else {
          infos.missingProperties.ean++;
          await updateCrawledProduct(shopDomain, link, {
            ean_locked: false,
            ean_taskId: "",
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
            await updateMatchingTasks(shops); // update matching tasks
            handleResult(r, resolve, reject);
          });
        }
        infos.total++;
      };
      const handleNotFound = async () => {
        infos.notFound++;
        await moveCrawledProduct(shopDomain, "grave", _id);
        if (infos.total >= _productLimit - 1 && !queue.idle()) {
          await checkProgress({
            queue,
            infos,
            startTime,
            productLimit: _productLimit,
          }).catch(async (r) => {
            clearInterval(interval);
            await updateMatchingTasks(shops); // update matching tasks
            handleResult(r, resolve, reject);
          });
        }
        infos.total++;
      };

      if (link) {
        queue.pushTask(queryProductPageQueue, {
          retries: 0,
          shop,
          addProduct,
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
            link,
            name: shop.d,
          },
        });
      } else {
        await moveCrawledProduct(shopDomain, "grave", _id);
        infos.total++;
      }
    }
  });
}
