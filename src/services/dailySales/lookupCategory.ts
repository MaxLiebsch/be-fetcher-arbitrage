import {
  AddProductInfoProps,
  Content,
  globalEventEmitter,
  NotFoundCause,
  ObjectId,
  queryProductPageQueue,
  QueryQueue,
  Shop,
  sleep,
  uuid,
} from "@dipmaxtech/clr-pkg";
import {
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  defaultQuery,
  proxyAuth,
  STANDARD_SETTLING_TIME,
} from "../../constants.js";
import { updateTask } from "../../db/util/tasks.js";
import {
  handleLookupCategoryNotFound,
  handleLookupCategoryProductInfo,
} from "../../util/lookupCategoryHelper.js";
import { DailySalesTask } from "../../types/tasks/DailySalesTask.js";
import { LookupCategoryStats } from "../../types/taskStats/LookupCategoryStats.js";
import { MultiStageReturnType } from "../../types/DailySalesReturnType.js";
import { WholeSaleEbyTask } from "../../types/tasks/Tasks.js";
import { TASK_TYPES } from "../../util/taskTypes.js";
import { updateWholesaleProgress } from "../../util/updateProgressInTasks.js";
import { log } from "../../util/logger.js";

export const lookupCategory = async (
  collection: string,
  ebay: Shop,
  origin: Pick<Shop, "d" | "ean" | "hasEan">,
  task: DailySalesTask | WholeSaleEbyTask
): Promise<MultiStageReturnType> =>
  new Promise(async (res, rej) => {
    const { browserConfig, _id: taskId, shopDomain } = task;
    if ('currentStep' in task) task.currentStep = 'LOOKUP_CATEGORY'
    const isWholeSaleEbyTask = task.type === TASK_TYPES.WHOLESALE_EBY_SEARCH;

    const { concurrency, productLimit } = browserConfig.lookupCategory;
    let infos: LookupCategoryStats = {
      total: 0,
      notFound: 0,
      locked: 0,
      shops: {
        [collection]: 0,
      },
      elapsedTime: "",
    };

    const queue = new QueryQueue(concurrency, proxyAuth, task);
    queue.actualProductLimit = task.lookupCategory && task.lookupCategory.length;
    const eventEmitter = globalEventEmitter;
    
    let done = false;
    eventEmitter.on(
      `${queue.queueId}-finished`,
      async function lookupCategoryCallback() {
        if (done) return;
        done = true;
        log(`Settling time for lookupCategory ${taskId}`);
        await sleep(STANDARD_SETTLING_TIME);
        if (isWholeSaleEbyTask) {
          await updateWholesaleProgress(taskId, "WHOLESALE_EBY_SEARCH");
        } else {
          await updateTask(taskId, { $set: { progress: task.progress } });
        }
        await queue.disconnect(true);
        res({ infos, queueStats: queue.queueStats });
      }
    );
    async function isProcessComplete() {
      if (infos.total === productLimit && !queue.idle()) {
        interval && clearInterval(interval);
        if (isWholeSaleEbyTask) {
          await updateWholesaleProgress(taskId, "WHOLESALE_EBY_SEARCH");
        } else {
          await updateTask(taskId, { $set: { progress: task.progress } });
        }
        await queue.disconnect(true);
        res({ infos, queueStats: queue.queueStats });
      }
    }

    const completedProducts: ObjectId[] = [];
    const interval = setInterval(async () => {
      if (isWholeSaleEbyTask) {
        await updateWholesaleProgress(taskId, "WHOLESALE_EBY_SEARCH");
      } else {
        await updateTask(taskId, {
          $pull: {
            "progress.lookupCategory": { _id: { $in: completedProducts } },
          },
        });
      }
    }, DEFAULT_CHECK_PROGRESS_INTERVAL);
    await queue.connect();

    while (task.progress.lookupCategory.length) {
      const product = task.lookupCategory.pop();
      task.progress.lookupCategory.pop();
      if (!product) continue;

      const { _id: productId, esin, s_hash } = product;

      const queryUrl = "https://www.ebay.de/itm/" + esin;

      const addProduct = async (
        product: Partial<Record<Content, string | number | boolean | string[]>>
      ) => {};
      const addProductInfo = async ({
        productInfo,
        url,
      }: AddProductInfoProps) => {
        completedProducts.push(productId);
        await handleLookupCategoryProductInfo(
          collection,
          Boolean(origin.hasEan || origin.ean),
          { productInfo, url },
          queue,
          infos,
          product,
          isWholeSaleEbyTask
        );
        await isProcessComplete();
      };
      const handleNotFound = async (cause: NotFoundCause) => {
        completedProducts.push(productId);
        await handleLookupCategoryNotFound(
          collection,
          infos,
          queue,
          productId,
          cause,
          isWholeSaleEbyTask
        );
        await isProcessComplete();
      };

      queue.pushTask(queryProductPageQueue, {
        retries: 0,
        shop: ebay,
        addProduct,
        proxyType: ebay.proxyType,
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
