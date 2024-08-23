import {
  globalEventEmitter,
  queryProductPageQueue,
  QueryQueue,
} from "@dipmaxtech/clr-pkg";
import { updateTask } from "../../services/db/util/tasks.js";
import { salesDbName } from "../../services/productPriceComparator.js";
import {
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  defaultQuery,
  proxyAuth,
} from "../../constants.js";
import {
  handleCrawlEanNotFound,
  handleCrawlEanProductInfo,
} from "../../util/crawlEanHelper.js";

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
      let { lnk: productLink } = product;

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
        await handleCrawlEanNotFound(
          salesDbName,
          productLink,
          shopDomain,
          cause
        );
        await isProcessComplete();
      };

      queue.pushTask(queryProductPageQueue, {
        retries: 0,
        shop,
        addProduct,
        targetShop: {
          name: shopDomain,
          prefix: "",
          d: shopDomain,
        },
        onNotFound: handleNotFound,
        retriesOnFail: 5,
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
