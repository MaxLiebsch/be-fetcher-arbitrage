import { QueryQueue, queryProductPageQueue } from "@dipmaxtech/clr-pkg";
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
import { updateProgressInLookupCategoryTask } from "../util/updateProgressInTasks.js";
import { lookForMissingEbyCategory } from "./db/util/lookupCategory/lookForMissingEbyCategory.js";
import { getShop } from "./db/util/shops.js";
import {
  handleLookupCategoryNotFound,
  handleLookupCategoryProductInfo,
} from "../util/lookupCategoryHelper.js";
import { getProductLimit } from "../util/getProductLimit.js";

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
      infos.shops[info.shop.d] = 0;
    });

    if (!products.length)
      return reject(new MissingProductsError(`No products ${type}`, task));

    const _productLimit =
      getProductLimit(products.length, productLimit);
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
        await handleLookupCategoryProductInfo(
          shopDomain,
          Boolean(srcShop.hasEan || srcShop.ean),
          { productInfo, url },
          queue,
          infos,
          product
        );
        await isProcessComplete();
      };
      const handleNotFound = async (cause) => {
        await handleLookupCategoryNotFound(
          shopDomain,
          infos,
          queue,
          productLink,
          cause
        );
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

export default lookupCategory;
