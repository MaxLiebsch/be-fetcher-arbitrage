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
  proxyAuth,
} from "../constants.js";
import { getShop } from "./db/util/shops.js";
import { checkProgress } from "../util/checkProgress.js";
import {
  updateCrawlEbyListingsProgress,
  updateProgressInQueryEansOnEbyTask,
} from "../util/updateProgressInTasks.js";
import { lockProductsForCrawlEbyListings } from "./db/util/crawlEbyListings/lockProductsForCrawlEbyListings.js";
import {
  handleEbyListingNotFound,
  handleEbyListingProductInfo,
} from "../util/scrapeEbyListingsHelper.js";

async function crawlEbyListings(task) {
  return new Promise(async (resolve, reject) => {
    const { shopDomain, productLimit, _id, action } = task;

    let infos = {
      new: 0,
      total: 1,
      old: 0,
      notFound: 0,
      locked: 0,
      missingProperties: {
        mappedCat: 0,
        calculationFailed: 0,
        name: 0,
        price: 0,
        link: 0,
        image: 0,
      },
    };

    const products = await lockProductsForCrawlEbyListings(
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
    task.actualProductLimit = _productLimit;

    infos.locked = products.length;

    //Update task progress
    await updateCrawlEbyListingsProgress(shopDomain);

    const startTime = Date.now();

    const shop = await getShop("ebay.de");

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
          await updateCrawlEbyListingsProgress(shopDomain);
          await updateProgressInQueryEansOnEbyTask(); // update query eans on eby task
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
          await updateCrawlEbyListingsProgress(shopDomain);
          await updateProgressInQueryEansOnEbyTask(); // update query eans on eby task
          handleResult(r, resolve, reject);
        }),
      DEFAULT_CHECK_PROGRESS_INTERVAL
    );

    for (let index = 0; index < products.length; index++) {
      const product = products[index];
      const {
        lnk: productLink,
        esin,
      } = product;

      const addProduct = async (product) => {};
      const addProductInfo = async ({ productInfo, url }) => {
        await handleEbyListingProductInfo(
          shopDomain,
          infos,
          { productInfo, url },
          queue,
          product
        );
        await isComplete();
      };

      const handleNotFound = async () => {
        await handleEbyListingNotFound(shopDomain, productLink, infos, queue);
        await isComplete();
      };

      let ebyLink = "https://www.ebay.de/itm/" + esin;

      queue.pushTask(queryProductPageQueue, {
        retries: 0,
        shop,
        addProduct,
        onNotFound: handleNotFound,
        addProductInfo,
        queue,
        query: defaultQuery,
        prio: 0,
        extendedLookUp: false,
        pageInfo: {
          link: ebyLink,
          name: shop.d,
        },
      });
    }
  });
}

export default crawlEbyListings;
