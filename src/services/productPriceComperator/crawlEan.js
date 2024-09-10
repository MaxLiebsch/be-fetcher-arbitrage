import {
  globalEventEmitter,
  queryProductPageQueue,
  QueryQueue,
  uuid,
} from "@dipmaxtech/clr-pkg";
import { updateTask } from "../../services/db/util/tasks.js";
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
import { removeSearchParams } from "../../util/removeSearch.js";
import { salesDbName } from "../db/mongo.js";

export const crawlEans = async (shop, task) =>
  new Promise(async (res, rej) => {
    const { browserConfig, _id, shopDomain } = task;
    const { concurrency, productLimit } = browserConfig.crawlEan;
    let infos = {
      total: 1,
      notFound: 0,
      locked: 0,
      shops: {},
      missingProperties: {
        [salesDbName]: {
          ean: 0,
          image: 0,
        },
      },
    };

    task.actualProductLimit = task.crawlEan.length;
    const queue = new QueryQueue(concurrency, proxyAuth, task);
    const eventEmitter = globalEventEmitter;

    eventEmitter.on(
      `${queue.queueId}-finished`,
      async function crawlEanCallback() {
        await updateTask(_id, { $set: { progress: task.progress } });
        await queue.disconnect(true);
        res(infos);
      }
    );
    const completedProducts = [];
    let interval = setInterval(async () => {
      await updateTask(_id, {
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
        await updateTask(_id, { $set: { progress: task.progress } });
        await queue.disconnect(true);
        res(infos);
      }
    }

    await queue.connect();

    while (task.progress.crawlEan.length) {
      task.progress.crawlEan.pop();
      const product = task.crawlEan.pop();
      if (!product) continue;
      let { lnk: productLink, s_hash } = product;
      productLink = removeSearchParams(productLink);

      const addProduct = async (product) => {};
      const addProductInfo = async ({ productInfo, url }) => {
        completedProducts.push(product._id);
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
      const handleNotFound = async (cause) => {
        completedProducts.push(product._id);
        infos.notFound++;
        infos.shops[shopDomain]++;
        infos.total++;
        queue.total++;
        await handleCrawlEanNotFound(
          salesDbName,
          productLink,
          cause
        );
        await isProcessComplete();
      };

      queue.pushTask(queryProductPageQueue, {
        retries: 0,
        shop,
        addProduct,
        requestId: uuid(),
        s_hash,
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
