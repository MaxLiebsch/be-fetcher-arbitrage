import {
  AddProductInfoProps,
  NotFoundCause,
  ProductRecord,
  QueryQueue,
  queryProductPageQueue,
  uuid,
} from "@dipmaxtech/clr-pkg";
import _ from "underscore";
import { handleResult } from "../handleResult.js";
import { MissingProductsError, MissingShopError } from "../errors.js";
import {
  CONCURRENCY,
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  defaultQuery,
  proxyAuth,
} from "../constants.js";
import { checkProgress } from "../util/checkProgress.js";
import { getShop } from "../db/util/shops.js";
import {
  handleLookupCategoryNotFound,
  handleLookupCategoryProductInfo,
} from "../util/lookupCategoryHelper.js";
import { getProductLimitMulti } from "../util/getProductLimit.js";
import { TaskCompletedStatus } from "../status.js";
import { LookupCategoryTask } from "../types/tasks/Tasks.js";
import { LookupCategoryStats } from "../types/taskStats/LookupCategoryStats.js";
import { TaskReturnType } from "../types/TaskReturnType.js";
import { log } from "../util/logger.js";
import { countRemainingProducts } from "../util/countRemainingProducts.js";
import { findPendingProductsForTask } from "../db/util/multiShopUtilities/findPendingProductsForTask.js";
import { setupAllowedDomainsBasedOnShops } from "../util/setupAllowedDomains.js";

async function lookupCategory(task: LookupCategoryTask): TaskReturnType {
  return new Promise(async (resolve, reject) => {
    const { productLimit, _id: taskId, action, type } = task;

    let infos: LookupCategoryStats = {
      total: 0,
      notFound: 0,
      locked: 0,
      shops: {},
      elapsedTime: "",
    };

    const { products: products, shops } = await findPendingProductsForTask(
      "LOOKUP_CATEGORY",
      taskId,
      action || "none",
      productLimit
    );

    if (action === "recover") {
      log(`Recovering ${type} and found ${products.length} products`);
    } else {
      log(`Starting ${type} with ${products.length} products`);
    }

    shops.forEach(async (info) => {
      infos.shops[info.shop.d] = 0;
    });

    if (!products.length)
      return reject(new MissingProductsError(`No products ${type}`, task));

    const _productLimit = getProductLimitMulti(products.length, productLimit);
    log(`Product limit: ${_productLimit}`);
    
    infos.locked = products.length;
    
    const startTime = Date.now();
    
    const toolInfo = await getShop("ebay.de");   
    if (!toolInfo) {
      return reject(new MissingShopError("ebay.de", task));
    }
    const { proxyType } = toolInfo;
    
    const queue = new QueryQueue(
      task?.concurrency ? task.concurrency : CONCURRENCY,
      proxyAuth,
      task
    );
    await setupAllowedDomainsBasedOnShops([toolInfo], task.type);
    queue.actualProductLimit = _productLimit;
    await queue.connect();

    let _completed = false;
    let cnt = 0;

    const isCompleted = async () => {
      const check = await checkProgress({
        task,
        queue,
        infos,
        startTime,
        productLimit: _productLimit,
      });
      if (check instanceof TaskCompletedStatus && !_completed) {
        _completed = true;
        const remaining = await countRemainingProducts(shops, taskId, type);
        log(`Remaining products: ${remaining}`);
        clearInterval(interval);
        handleResult(check, resolve, reject);
      } else if (check !== undefined && _completed) {
        cnt++;
        log(`Task already completed ${_completed} ${cnt}`);
      }
    };

    const interval = setInterval(
      async () => await isCompleted(),
      DEFAULT_CHECK_PROGRESS_INTERVAL
    );

    for (let index = 0; index < products.length; index++) {
      let { shop: srcShop, product } = products[index];
      const { _id: productId, esin, s_hash } = product;

      const queryUrl = "https://www.ebay.de/itm/" + esin;

      const shopDomain = srcShop.d;

      const addProduct = async (product: ProductRecord) => {};
      const addProductInfo = async ({
        productInfo,
        url,
      }: AddProductInfoProps) => {
        await handleLookupCategoryProductInfo(
          shopDomain,
          Boolean(srcShop.hasEan || srcShop.ean),
          { productInfo, url },
          queue,
          infos,
          product
        );
        await isCompleted();
      };
      const handleNotFound = async (cause: NotFoundCause) => {
        await handleLookupCategoryNotFound(
          shopDomain,
          infos,
          queue,
          productId,
          cause
        );
        await isCompleted();
      };

      queue.pushTask(queryProductPageQueue, {
        retries: 0,
        shop: toolInfo,
        s_hash,
        requestId: uuid(),
        addProduct,
        targetShop: {
          name: shopDomain,
          d: shopDomain,
          prefix: "",
        },
        onNotFound: handleNotFound,
        addProductInfo,
        proxyType,
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
