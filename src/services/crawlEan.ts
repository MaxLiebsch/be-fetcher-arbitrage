import {
  AddProductInfoProps,
  NotFoundCause,
  ProductRecord,
  QueryQueue,
  Shop,
  queryProductPageQueue,
  sleep,
  uuid,
  removeSearchParams,
} from "@dipmaxtech/clr-pkg";
import _ from "underscore";

import { handleResult } from "../handleResult";
import { MissingProductsError, TaskErrors } from "../errors";
import {
  CONCURRENCY,
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  defaultQuery,
  MAX_RETRIES_SCRAPE_EAN,
  proxyAuth,
} from "../constants";
import { checkProgress } from "../util/checkProgress";
import { lookForMissingEans } from "../db/util/crawlEan/lookForMissingEans";
import { updateProgressInMatchTasks } from "../util/updateProgressInMatchTasks";
import {
  updateProgressInCrawlEanTask,
  updateProgressInLookupInfoTask,
  updateProgressInQueryEansOnEbyTask,
} from "../util/updateProgressInTasks";
import {
  handleCrawlEanNotFound,
  handleCrawlEanProductInfo,
} from "../util/crawlEanHelper";
import { getProductLimitMulti } from "../util/getProductLimit";
import { TaskCompletedStatus } from "../status.js";
import { ScrapeEanStats } from "../types/taskStats/ScrapeEanStats";
import { ScrapeEansTask } from "../types/tasks/Tasks";
import { TaskReturnType } from "../types/TaskReturnType";
import { log } from "../util/logger";
import { countRemainingProducts } from "../util/countRemainingProducts";
import { setTaskId } from "../db/util/queries";

export default async function crawlEan(task: ScrapeEansTask): TaskReturnType {
  return new Promise(async (resolve, reject) => {
    const { productLimit, _id: taskId, action, proxyType, type } = task;

    let infos: ScrapeEanStats = {
      total: 0,
      notFound: 0,
      locked: 0,
      shops: {},
      missingProperties: {},
      elapsedTime: "",
    };

    const { products, shops } = await lookForMissingEans(
      taskId,
      proxyType,
      action || "none",
      productLimit
    );

    if (action === "recover") {
      log(`Recovering ${type} and found ${products.length} products`);
    } else {
      log(`Starting ${type} with ${products.length} products`);
    }

    shops.forEach((info) => {
      infos.shops[info.shop.d] = 0;
      infos.missingProperties[info.shop.d] = {
        ean: 0,
        image: 0,
      };
    });

    if (!products.length)
      return reject(new MissingProductsError(`No products ${type}`, task));

    const _productLimit = getProductLimitMulti(products.length, productLimit);
    log(`Product limit: ${_productLimit}`);
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
    queue.total = 0;
    await queue.connect();

    const isComplete = async () => {
      const check = await checkProgress({
        task,
        queue,
        infos,
        startTime,
        productLimit: _productLimit,
      });
      if (check instanceof TaskCompletedStatus) {
        await Promise.all([
          updateProgressInCrawlEanTask(proxyType), // update crawl ean task
          updateProgressInMatchTasks(shops), // update matching tasks
          updateProgressInLookupInfoTask(), // update lookup info task
          updateProgressInQueryEansOnEbyTask(), // update query eans on eby task
        ]);
        const remaining = await countRemainingProducts(shops, taskId, type);
        log(`Remaining products: ${remaining}, taskId ${setTaskId(taskId)}`);
        handleResult(check, resolve, reject);
      }
    };

    for (let index = 0; index < products.length; index++) {
      const { shop, product } = products[index];
      let { lnk: productLink, _id: productId, s_hash } = product;
      productLink = removeSearchParams(productLink);

      const shopDomain = shop.d;

      const addProduct = async (product: ProductRecord) => {};
      const addProductInfo = async ({
        productInfo,
        url,
      }: AddProductInfoProps) => {
        await handleCrawlEanProductInfo(
          shopDomain,
          { productInfo, url },
          queue,
          product,
          infos
        );
        await isComplete();
      };
      const handleNotFound = async (cause: NotFoundCause) => {
        await handleCrawlEanNotFound(shopDomain, cause, productId);

        infos.notFound++;
        infos.shops[shopDomain]++;
        infos.total++;
        queue.total++;

        await isComplete();
      };

      queue.pushTask(queryProductPageQueue, {
        retries: 0,
        s_hash,
        requestId: uuid(),
        shop: shop as Shop,
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
