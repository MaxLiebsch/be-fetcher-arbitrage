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
  updateCrawlAznListingsProgress,
  updateProgressInLookupInfoTask,
} from "../util/updateProgressInTasks.js";
import { lockProductsForCrawlAznListings } from "./db/util/crawlAznListings/lockProductsForCrawlAznListings.js";
import {
  handleAznListingNotFound,
  handleAznListingProductInfo,
} from "../util/scrapeAznListingsHelper.js";

export default async function crawlAznListings(task) {
  return new Promise(async (resolve, reject) => {
    const { shopDomain, productLimit, _id, action, concurrency } = task;

    let infos = {
      new: 0,
      total: 1,
      old: 0,
      notFound: 0,
      locked: 0,
      missingProperties: {
        bsr: 0,
        aznCostNeg: 0,
        infos: 0,
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
    task.actualProductLimit = _productLimit;

    infos.locked = products.length;

    //Update task progress
    await updateCrawlAznListingsProgress(shopDomain);

    const startTime = Date.now();

    const amazonShop = await getShop("amazon.de");

    const queue = new QueryQueue(
      concurrency ? concurrency : CONCURRENCY,
      proxyAuth,
      task
    );
    queue.total = 1;
    await queue.connect();

    const isCompleted = async () => {
      if (infos.total === _productLimit && !queue.idle()) {
        await checkProgress({
          queue,
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
          await updateCrawlAznListingsProgress(shopDomain);
          await updateProgressInLookupInfoTask(); // update lookup info task progress
          handleResult(r, resolve, reject);
        }),
      DEFAULT_CHECK_PROGRESS_INTERVAL
    );

    for (let index = 0; index < products.length; index++) {
      const product = products[index];
      const { asin, lnk: productLink } = product;

      const addProduct = async (product) => {};
      const addProductInfo = async ({ productInfo, url }) => {
        await handleAznListingProductInfo(
          shopDomain,
          product,
          { productInfo, url },
          infos,
          queue
        );
        await isCompleted();
      };
      const handleNotFound = async () => {
        await handleAznListingNotFound(shopDomain, productLink, infos, queue);
        await isCompleted();
      };

      let aznLink =
        "https://www.amazon.de/dp/product/" + asin + "?language=de_DE";

      queue.pushTask(queryProductPageQueue, {
        retries: 0,
        shop: amazonShop,
        addProduct,
        onNotFound: handleNotFound,
        addProductInfo,
        queue,
        query: defaultQuery,
        prio: 0,
        extendedLookUp: false,
        pageInfo: {
          link: aznLink,
          name: amazonShop.d,
        },
      });
    }
  });
}
