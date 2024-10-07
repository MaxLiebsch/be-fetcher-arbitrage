import {
  AddProductInfoProps,
  DbProductRecord,
  globalEventEmitter,
  NotFoundCause,
  ObjectId,
  ProductRecord,
  queryProductPageQueue,
  QueryQueue,
  Shop,
  uuid,
  removeSearchParams 
} from "@dipmaxtech/clr-pkg";
import { updateTask } from "../../db/util/tasks.js";
import {
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  defaultQuery,
  MAX_RETRIES_SCRAPE_EAN,
  proxyAuth,
} from "../../constants.js";
import {
  handleCrawlEanNotFound,
  handleCrawlEanProductInfo,
} from "../../util/crawlEanHelper.js";

import { salesDbName } from "../../db/mongo.js";
import { DailySalesTask } from "../../types/tasks/DailySalesTask.js";
import { ScrapeEanStats } from "../../types/taskStats/ScrapeEanStats.js";
import { MultiStageReturnType } from "../../types/DailySalesReturnType.js";

export const crawlEans = async (
  shop: Shop,
  task: DailySalesTask
): Promise<MultiStageReturnType> =>
  new Promise(async (res, rej) => {
    const { browserConfig, _id: taskId, shopDomain, proxyType } = task;
    const { concurrency, productLimit } = browserConfig.crawlEan;
    let infos: ScrapeEanStats = {
      total: 0,
      notFound: 0,
      locked: 0,
      shops: {},
      missingProperties: {
        [salesDbName]: {
          ean: 0,
          image: 0,
        },
      },
      elapsedTime: "",
    };

    task.actualProductLimit = task.crawlEan.length;
    const queue = new QueryQueue(concurrency, proxyAuth, task);
    const eventEmitter = globalEventEmitter;

    eventEmitter.on(
      `${queue.queueId}-finished`,
      async function crawlEanCallback() {
        await updateTask(taskId, { $set: { progress: task.progress } });
        await queue.disconnect(true);
        res({ infos, queueStats: queue.queueStats });
      }
    );
    const completedProducts: ObjectId[] = [];
    let interval = setInterval(async () => {
      await updateTask(taskId, {
        $pull: {
          "progress.crawlEan": { _id: { $in: completedProducts } },
        },
        $addToSet: {
          "progress.queryEansOnEby": { $each: task.progress.queryEansOnEby },
          "progress.lookupInfo": { $each: task.progress.lookupInfo },
        },
      });
    }, DEFAULT_CHECK_PROGRESS_INTERVAL);

    async function isProcessComplete() {
      if (infos.total === productLimit && !queue.idle()) {
        console.log("product limit reached");
        interval && clearInterval(interval);
        await updateTask(taskId, { $set: { progress: task.progress } });
        await queue.disconnect(true);
        res({ infos, queueStats: queue.queueStats });
      }
    }

    await queue.connect();

    while (task.progress.crawlEan.length) {
      task.progress.crawlEan.pop();
      const product = task.crawlEan.pop();
      if (!product) continue;
      let { lnk: productLink, s_hash, _id: productId } = product;
      productLink = removeSearchParams(productLink);

      const addProduct = async (product: ProductRecord) => {};
      const addProductInfo = async ({
        productInfo,
        url,
      }: AddProductInfoProps) => {
        completedProducts.push(productId);
        await handleCrawlEanProductInfo(
          salesDbName,
          { productInfo, url },
          queue,
          product,
          infos,
          task
        );
        await isProcessComplete();
      };
      const handleNotFound = async (cause: NotFoundCause) => {
        completedProducts.push(productId);
        infos.notFound++;
        infos.shops[shopDomain]++;
        infos.total++;
        queue.total++;
        await handleCrawlEanNotFound(salesDbName, cause, productId);
        await isProcessComplete();
      };

      queue.pushTask(queryProductPageQueue, {
        retries: 0,
        shop,
        addProduct,
        requestId: uuid(),
        s_hash,
        proxyType,
        targetShop: {
          name: shopDomain,
          prefix: "",
          d: shopDomain,
        },
        onNotFound: handleNotFound,
        retriesOnFail: MAX_RETRIES_SCRAPE_EAN,
        addProductInfo,
        queue: queue,
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
