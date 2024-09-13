import {
  Content,
  DbProduct,
  DbProductRecord,
  globalEventEmitter,
  NotFoundCause,
  ObjectId,
  Product,
  queryEansOnEbyQueue,
  QueryQueue,
  queryURLBuilder,
  Shop,
  uuid,
} from "@dipmaxtech/clr-pkg";
import {
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  defaultQuery,
  proxyAuth,
} from "../../constants";
import { updateTask } from "../../db/util/tasks";
import {
  handleQueryEansOnEbyIsFinished,
  handleQueryEansOnEbyNotFound,
} from "../../util/queryEansOnEbyHelper";
import { salesDbName } from "../../db/mongo";
import { DailySalesTask } from "../../types/tasks/DailySalesTask";
import { QueryEansOnEbyStats } from "../../types/taskStats/QueryEansOnEbyStats";
import { DailySalesReturnType } from "../../types/DailySalesReturnType";

export const queryEansOnEby = async (
  ebay: Shop,
  task: DailySalesTask
): Promise<DailySalesReturnType> =>
  new Promise(async (res, rej) => {
    const { browserConfig, _id: taskId } = task;
    const { concurrency, productLimit } = browserConfig.queryEansOnEby;

    task.actualProductLimit = task.queryEansOnEby.length;
    const queue = new QueryQueue(concurrency, proxyAuth, task);

    const eventEmitter = globalEventEmitter;

    eventEmitter.on(
      `${queue.queueId}-finished`,
      async function queryEansOnEbyCallback() {
        interval && clearInterval(interval);
        await updateTask(taskId, { $set: { progress: task.progress } });
        await queue.disconnect(true);
        res({ infos, queueStats: queue.queueStats });
      }
    );

    const completedProducts: ObjectId[] = [];
    let interval = setInterval(async () => {
      await updateTask(taskId, {
        $pull: {
          "progress.queryEansOnEby": { _id: { $in: completedProducts } },
        },
        $addToSet: {
          "progress.lookupCategory": { $each: task.progress.lookupCategory },
        },
      });
    }, DEFAULT_CHECK_PROGRESS_INTERVAL);

    await queue.connect();
    let infos: QueryEansOnEbyStats = {
      total: 1,
      notFound: 0,
      locked: 0,

      shops: {
        [salesDbName]: 0,
      },
      missingProperties: {
        [salesDbName]: {
          ean: 0,
          image: 0,
        },
      },
      elapsedTime: "",
    };

    async function isProcessComplete() {
      if (infos.total === productLimit && !queue.idle()) {
        interval && clearInterval(interval);
        await updateTask(taskId, { $set: { progress: task.progress } });
        await queue.disconnect(true);
        res({ infos, queueStats: queue.queueStats });
      }
    }

    while (task.progress.queryEansOnEby.length) {
      const product = task.queryEansOnEby.pop();
      task.progress.queryEansOnEby.pop();
      if (!product) continue;

      const { ean, s_hash, _id: productId } = product;
      const foundProducts: Product[] = [];

      const addProduct = async (
        product: Partial<Record<Content, string | number | boolean | string[]>>
      ) => {
        foundProducts.push(product as Product);
      };
      const isFinished = async () => {
        completedProducts.push(productId);
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
      const handleNotFound = async (cause: NotFoundCause) => {
        completedProducts.push(productId);
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
