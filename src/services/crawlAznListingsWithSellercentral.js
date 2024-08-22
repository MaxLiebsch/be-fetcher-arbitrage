import {
  QueryQueue,
  globalEventEmitter,
  querySellerInfosQueue,
  yieldQueues,
} from "@dipmaxtech/clr-pkg";
import _ from "underscore";

import { handleResult } from "../handleResult.js";
import { MissingProductsError } from "../errors.js";
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
import { getMaxLoadQueue } from "../services/productPriceComperator/lookupInfo.js";
import {
  handleLookupInfoNotFound,
  handleLookupInfoProductInfo,
} from "../util/lookupInfoHelper.js";

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
      total: 1,
      old: 0,
      notFound: 0,
      locked: 0,
      missingProperties: {
        bsr: 0,
        aznCostNeg: 0,
        name: 0,
        price: 0,
        infos: 0,
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
      getProductLimit(products.length, productLimit);
    task.actualProductLimit = _productLimit;

    infos.locked = products.length;

    //Update task progress
    await updateCrawlAznListingsProgress(shopDomain);

    const startTime = Date.now();
    const srcShops = await getShop(shopDomain);
    const { hasEan, ean: eanSelector } = srcShops;
    const toolInfo = await getShop("sellercentral.amazon.de");
    const queryQueues = [];
    const queuesWithId = {};
    const eventEmitter = globalEventEmitter;

    const interval = setInterval(
      async () =>
        await checkProgress({
          queue: queryQueues,
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

    const isCompleted = async (queue) => {
      if (infos.total === _productLimit && !queue.idle()) {
        await checkProgress({
          queue: queryQueues,
          infos,
          startTime,
          productLimit: _productLimit,
        }).catch(async (r) => {
          interval && clearInterval(interval);
          await updateCrawlAznListingsProgress(shopDomain);
          await updateProgressInLookupInfoTask(); // update lookup info task progress
          handleResult(r, resolve, reject);
        });
      }
    };

    await Promise.all(
      Array.from({ length: browserConcurrency ?? 1 }, (v, k) => k + 1).map(
        async () => {
          const queue = new QueryQueue(
            concurrency ? concurrency : CONCURRENCY,
            proxyAuth,
            task
          );
          queue.total = 1;
          queuesWithId[queue.queueId] = queue;
          //@ts-ignore
          eventEmitter.on(
            `${queue.queueId}-finished`,
            async function crawlAznListingsCallback({ queueId }) {
              console.log("Emitter: Queue completed ", queueId);
              const maxQueue = getMaxLoadQueue(queryQueues);
              const tasks = maxQueue.pullTasksFromQueue();
              if (tasks) {
                console.log("adding tasks to queue: ", queueId, tasks.length);
                queuesWithId[queueId].addTasksToQueue(tasks);
              } else {
                console.log("no more tasks to distribute. Closing ", queueId);
                await queuesWithId[queueId].disconnect(true);
                const isDone = queryQueues.every((q) => q.workload() === 0);
                if (isDone) {
                  await checkProgress({
                    queue: queryQueues,
                    infos,
                    startTime,
                    productLimit: _productLimit,
                  }).catch(async (r) => {
                    interval && clearInterval(interval);
                    await updateCrawlAznListingsProgress(shopDomain);
                    await updateProgressInLookupInfoTask(); // update lookup info task progress
                    handleResult(r, resolve, reject);
                  });
                }
              }
            }
          );
          queryQueues.push(queue);
          return queue.connect();
        }
      )
    );

    const queueIterator = yieldQueues(queryQueues);

    for (let index = 0; index < products.length; index++) {
      const queue = queueIterator.next().value;
      const product = products[index];
      const { lnk: productLink, asin } = product;

      const addProduct = async (product) => {};
      const addProductInfo = async ({ productInfo, url }) => {
        infos.total++;
        queue.total++;
        await handleLookupInfoProductInfo(
          shopDomain,
          Boolean(hasEan || eanSelector),
          { productInfo, url },
          product,
          infos
        );
        await isCompleted(queue);
      };
      const handleNotFound = async () => {
        infos.notFound++;
        infos.total++;
        queue.total++;
        await handleLookupInfoNotFound(shopDomain, productLink);
        await isCompleted(queue);
      };
      const query = {
        product: {
          value: asin,
          key: asin,
        },
      };
      queue.pushTask(querySellerInfosQueue, {
        retries: 0,
        shop: toolInfo,
        addProduct,
        lookupRetryLimit: 0,
        targetShop: {
          prefix: "",
          d: shopDomain,
          name: shopDomain,
        },
        onNotFound: handleNotFound,
        addProductInfo,
        queue,
        query,
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
