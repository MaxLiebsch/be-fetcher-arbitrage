import {
  globalEventEmitter,
  queryEansOnEbyQueue,
  QueryQueue,
  queryURLBuilder,
  uuid,
} from "@dipmaxtech/clr-pkg";
import {
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  defaultQuery,
  proxyAuth,
} from "../../constants.js";
import { updateTask } from "../../services/db/util/tasks.js";
import {
  handleQueryEansOnEbyIsFinished,
  handleQueryEansOnEbyNotFound,
} from "../../util/queryEansOnEbyHelper.js";
import { salesDbName } from "../db/mongo.js";

export const queryEansOnEby = async (ebay, task) =>
  new Promise(async (res, rej) => {
    const { browserConfig, _id } = task;
    const { concurrency, productLimit } = browserConfig.queryEansOnEby;

    task.actualProductLimit = task.queryEansOnEby.length;
    const queue = new QueryQueue(concurrency, proxyAuth, task);

    const eventEmitter = globalEventEmitter;

    eventEmitter.on(
      `${queue.queueId}-finished`,
      async function queryEansOnEbyCallback() {
        interval && clearInterval(interval);
        await updateTask(_id, { $set: { progress: task.progress } });
        await queue.disconnect(true);
        res(infos);
      }
    );

    const completedProducts = [];
    let interval = setInterval(async () => {
      await updateTask(_id, {
        $pull: {
          "progress.queryEansOnEby": { _id: { $in: completedProducts } },
        },
        $addToSet: {
          "progress.lookupCategory": { $each: task.progress.lookupCategory },
        },
      });
    }, DEFAULT_CHECK_PROGRESS_INTERVAL);

    await queue.connect();
    let infos = {
      new: 0,
      total: 1,
      old: 0,
      notFound: 0,
      locked: 0,

      shops: {
        [salesDbName]: 0,
      },
      missingProperties: {
        [salesDbName]: {
          ean: 0,
          image: 0,
          hashes: [],
        },
      },
    };

    async function isProcessComplete() {
      if (infos.total === productLimit && !queue.idle()) {
        interval && clearInterval(interval);
        await updateTask(_id, { $set: { progress: task.progress } });
        await queue.disconnect(true);
        res(infos);
      }
    }

    while (task.progress.queryEansOnEby.length) {
      const product = task.queryEansOnEby.pop();
      task.progress.queryEansOnEby.pop();
      if (!product) continue;

      const { ean, s_hash } = product;
      const foundProducts = [];

      const addProduct = async (product) => {
        foundProducts.push(product);
      };
      const isFinished = async () => {
        completedProducts.push(product._id);
        await handleQueryEansOnEbyIsFinished(
          salesDbName,
          queue,
          product,
          infos,
          foundProducts,
          task
        );
        await isProcessComplete();
      };
      const handleNotFound = async (cause) => {
        completedProducts.push(product._id);
        await handleQueryEansOnEbyNotFound(salesDbName, infos, product, queue);
        await isProcessComplete();
      };

      const query = {
        ...defaultQuery,
        product: {
          value: ean,
          key: ean,
        },
        category: "default",
      };
      const queryLink = queryURLBuilder(ebay.queryUrlSchema, query).url;
      queue.pushTask(queryEansOnEbyQueue, {
        retries: 0,
        requestId: uuid(),
        s_hash,
        shop: ebay,
        targetShop: {
          prefix: "",
          d: salesDbName,
          name: salesDbName,
        },
        addProduct,
        isFinished,
        onNotFound: handleNotFound,
        queue: queue,
        query,
        prio: 0,
        extendedLookUp: false,
        limit: undefined,
        pageInfo: {
          link: queryLink,
          name: ebay.d,
        },
      });
    }
  });
