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
  defaultQuery,
  MAX_RETRIES_SCRAPE_EAN,
  proxyAuth,
} from "../constants.js";
import { checkProgress } from "../util/checkProgress.js";
import { lookForMissingEans } from "./db/util/crawlEan/lookForMissingEans.js";
import { updateProgressInMatchTasks } from "../util/updateProgressInMatchTasks.js";
import {
  updateProgressDealTasks,
  updateProgressInCrawlEanTask,
  updateProgressInLookupInfoTask,
  updateProgressInQueryEansOnEbyTask,
} from "../util/updateProgressInTasks.js";
import {
  handleCrawlEanNotFound,
  handleCrawlEanProductInfo,
} from "../util/crawlEanHelper.js";
import { getProductLimit } from "../util/getProductLimit.js";

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
      getProductLimit(products.length, productLimit);
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
            updateProgressDealTasks(proxyType) // update deal tasks
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
            updateProgressDealTasks(proxyType) // update deal tasks
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
        await handleCrawlEanProductInfo(
          shopDomain,
          { productInfo, url },
          queue,
          product,
          infos
        );
        await isComplete();
      };
      const handleNotFound = async (cause) => {
        await handleCrawlEanNotFound(
          shopDomain,
          infos,
          queue,
          cause,
          productLink
        );
        await isComplete();
      };

      queue.pushTask(queryProductPageQueue, {
        retries: 0,
        shop,
        addProduct,
        retriesOnFail: MAX_RETRIES_SCRAPE_EAN,
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
