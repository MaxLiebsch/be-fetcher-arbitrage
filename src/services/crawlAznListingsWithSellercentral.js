import {
  QueryQueue,
  generateUpdate,
  querySellerInfosQueue,
  yieldQueues,
} from "@dipmaxtech/clr-pkg";
import _ from "underscore";

import { handleResult } from "../handleResult.js";
import { MissingProductsError } from "../errors.js";
import { updateArbispotterProduct } from "./db/util/crudArbispotterProduct.js";
import {
  CONCURRENCY,
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  proxyAuth,
} from "../constants.js";
import { getShop } from "./db/util/shops.js";
import { checkProgress } from "../util/checkProgress.js";
import {
  updateCrawlAznListingsProgress,
  updateProgressInLookupInfoTask,
} from "../util/updateProgressInTasks.js";
import { lockProductsForCrawlAznListings } from "./db/util/crawlAznListings/lockProductsForCrawlAznListings.js";
import { updateCrawlDataProduct } from "./db/util/crudCrawlDataProduct.js";
import { upsertAsin } from "./db/util/asinTable.js";
import { resetAznProduct } from "./lookupInfo.js";

export default async function crawlAznListingsWithSellercentral(task) {
  return new Promise(async (resolve, reject) => {
    const {
      shopDomain,
      productLimit,
      _id,
      action,
      browserConcurrency,
      concurrency,
    } = task;

    let infos = {
      new: 0,
      total: 0,
      old: 0,
      notFound: 0,
      locked: 0,
      missingProperties: {
        bsr: 0,
        name: 0,
        price: 0,
        link: 0,
        image: 0,
      },
    };

    const products = await lockProductsForCrawlAznListings(
      shopDomain,
      productLimit,
      _id,
      action
    );

    if (!products.length)
      return reject(
        new MissingProductsError(`No products for ${shopDomain}`, task)
      );

    const _productLimit =
      products.length < productLimit ? products.length : productLimit;

    infos.locked = products.length;

    //Update task progress
    await updateCrawlAznListingsProgress(shopDomain);

    const startTime = Date.now();
    const srcShops = await getShop(shopDomain);
    const { hasEan, ean: eanSelector } = srcShops;
    const toolInfo = await getShop("sellercentral.amazon.de");
    const queues = [];

    await Promise.all(
      Array.from({ length: browserConcurrency ?? 1 }, (v, k) => k + 1).map(
        async () => {
          const queue = new QueryQueue(
            concurrency ? concurrency : CONCURRENCY,
            proxyAuth,
            task
          );
          queues.push(queue);
          return queue.connect();
        }
      )
    );

    const queueIterator = yieldQueues(queues);

    const interval = setInterval(
      async () =>
        await checkProgress({
          queue: queues,
          infos,
          startTime,
          productLimit: _productLimit,
        }).catch(async (r) => {
          clearInterval(interval);
          await updateCrawlAznListingsProgress(shopDomain);
          await updateProgressInLookupInfoTask(); // update lookup info task progress
          handleResult(r, resolve, reject);
        }),
      DEFAULT_CHECK_PROGRESS_INTERVAL
    );

    for (let index = 0; index < products.length; index++) {
      const queue = queueIterator.next().value;
      const crawlDataProduct = products[index];
      const {
        link: productLink,
        asin,
        ean,
        uprc: unitPrice,
        price: buyPrice,
        a_qty,
        qty,
      } = crawlDataProduct;

      const addProduct = async (product) => {};
      const addProductInfo = async ({ productInfo, url }) => {
        if (productInfo) {
          const processedProductUpdate = generateUpdate(
            productInfo,
            buyPrice,
            a_qty ?? 1,
            qty ?? 1
          );
          let eanList = [];
          if (hasEan || eanSelector) {
            eanList = [ean];
          }
          await upsertAsin(asin, eanList, processedProductUpdate.costs);

          const arbispotterProductUpdate = { ...processedProductUpdate };

          const crawlDataProductUpdate = {
            aznUpdatedAt: new Date().toISOString(),
            azn_locked: false,
            azn_taskId: "",
          };

          await updateArbispotterProduct(
            shopDomain,
            productLink,
            arbispotterProductUpdate
          );
          await updateCrawlDataProduct(
            shopDomain,
            productLink,
            crawlDataProductUpdate
          );
        } else {
          infos.missingProperties.bsr++;
          await updateCrawlDataProduct(shopDomain, productLink, {
            azn_locked: false,
            azn_taskId: "",
          });
        }
        if (infos.total >= _productLimit - 1 && !queue.idle()) {
          await checkProgress({
            queue: queues,
            infos,
            startTime,
            productLimit: _productLimit,
          }).catch(async (r) => {
            clearInterval(interval);
            await updateCrawlAznListingsProgress(shopDomain);
            await updateProgressInLookupInfoTask(); // update lookup info task progress
            handleResult(r, resolve, reject);
          });
        }
        infos.total++;
      };
      const handleNotFound = async () => {
        infos.notFound++;
        await updateCrawlDataProduct(shopDomain, productLink, {
          azn_locked: false,
          azn_taskId: "",
          asin: "",
          a_qty: 0,
          info_prop: "", // reset lookup info to start over
        });
        await updateArbispotterProduct(
          shopDomain,
          productLink,
          resetAznProduct()
        );
        if (infos.total >= _productLimit - 1 && !queue.idle()) {
          await checkProgress({
            queue: queues,
            infos,
            startTime,
            productLimit: _productLimit,
          }).catch(async (r) => {
            clearInterval(interval);
            await updateCrawlAznListingsProgress(shopDomain);
            await updateProgressInLookupInfoTask(); // update lookup info task progress
            handleResult(r, resolve, reject);
          });
        }
        infos.total++;
      };

      queue.pushTask(querySellerInfosQueue, {
        retries: 0,
        shop: toolInfo,
        addProduct,
        targetShop: {
          prefix: "",
          d: shopDomain,
          name: shopDomain,
        },
        onNotFound: handleNotFound,
        addProductInfo,
        queue,
        query: {
          product: {
            value: asin,
            key: asin,
          },
        },
        prio: 0,
        extendedLookUp: false,
        pageInfo: {
          link: toolInfo.entryPoints[0].url,
          name: toolInfo.d,
        },
      });
    }
  });
}
