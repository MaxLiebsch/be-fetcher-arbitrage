import {
  AddProductInfoProps,
  Content,
  globalEventEmitter,
  NotFoundCause,
  ObjectId,
  queryProductPageQueue,
  QueryQueue,
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
  handleLookupCategoryNotFound,
  handleLookupCategoryProductInfo,
} from "../../util/lookupCategoryHelper";
import { salesDbName } from "../../db/mongo";
import { DailySalesTask } from "../../types/tasks/DailySalesTask";
import { LookupCategoryStats } from "../../types/taskStats/LookupCategoryStats";
import { DailySalesReturnType } from "../../types/DailySalesReturnType";

export const lookupCategory = async (
  ebay: Shop,
  origin: Shop,
  task: DailySalesTask
): Promise<DailySalesReturnType> =>
  new Promise(async (res, rej) => {
    const { browserConfig, _id, shopDomain } = task;
    const { concurrency, productLimit } = browserConfig.lookupCategory;
    let infos: LookupCategoryStats = {
      total: 0,
      notFound: 0,
      locked: 0,
      shops: {
        [salesDbName]: 0,
      },
      elapsedTime: "",
    };

    task.actualProductLimit = task.lookupCategory.length;
    const queue = new QueryQueue(concurrency, proxyAuth, task);
    const eventEmitter = globalEventEmitter;

    eventEmitter.on(
      `${queue.queueId}-finished`,
      async function lookupCategoryCallback() {
        await updateTask(_id, { $set: { progress: task.progress } });
        await queue.disconnect(true);
        res({ infos, queueStats: queue.queueStats });
      }
    );
    async function isProcessComplete() {
      if (infos.total === productLimit && !queue.idle()) {
        interval && clearInterval(interval);
        await updateTask(_id, { $set: { progress: task.progress } });
        await queue.disconnect(true);
        res({ infos, queueStats: queue.queueStats });
      }
    }

    const completedProducts: ObjectId[] = [];
    let interval = setInterval(async () => {
      await updateTask(_id, {
        $pull: {
          "progress.lookupCategory": { _id: { $in: completedProducts } },
        },
      });
    }, DEFAULT_CHECK_PROGRESS_INTERVAL);
    await queue.connect();

    while (task.progress.lookupCategory.length) {
      const product = task.lookupCategory.pop();
      task.progress.lookupCategory.pop();
      if (!product) continue;

      const { lnk: productLink, esin, s_hash } = product;

      const queryUrl = "https://www.ebay.de/itm/" + esin;

      const addProduct = async (
        product: Partial<Record<Content, string | number | boolean | string[]>>
      ) => {};
      const addProductInfo = async ({
        productInfo,
        url,
      }: AddProductInfoProps) => {
        completedProducts.push(product._id);
        await handleLookupCategoryProductInfo(
          salesDbName,
          Boolean(origin.hasEan || origin.ean),
          { productInfo, url },
          queue,
          infos,
          product
        );
        await isProcessComplete();
      };
      const handleNotFound = async (cause: NotFoundCause) => {
        completedProducts.push(product._id);
        await handleLookupCategoryNotFound(
          salesDbName,
          infos,
          queue,
          productLink,
          cause
        );
        await isProcessComplete();
      };

      queue.pushTask(queryProductPageQueue, {
        retries: 0,
        shop: ebay,
        addProduct,
        requestId: uuid(),
        s_hash,
        targetShop: {
          name: shopDomain,
          d: shopDomain,
          prefix: "",
        },
        onNotFound: handleNotFound,
        addProductInfo,
        queue: queue,
        query: defaultQuery,
        prio: 0,
        extendedLookUp: false,
        limit: undefined,
        prodInfo: undefined,
        isFinished: undefined,
        pageInfo: {
          link: queryUrl,
          name: origin.d,
        },
      });
    }
  });
