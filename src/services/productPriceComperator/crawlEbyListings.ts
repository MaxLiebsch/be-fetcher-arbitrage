import {
  AddProductInfoProps,
  Content,
  globalEventEmitter,
  NotFoundCause,
  queryProductPageQueue,
  QueryQueue,
  Shop,
  uuid,
} from "@dipmaxtech/clr-pkg";
import { defaultQuery, proxyAuth } from "../../constants.js";
import { updateTask } from "../../db/util/tasks.js";
import {
  handleEbyListingNotFound,
  handleEbyListingProductInfo,
} from "../../util/scrapeEbyListingsHelper.js";
import { salesDbName } from "../../db/mongo.js";
import { DailySalesTask } from "../../types/tasks/DailySalesTask.js";
import { DealsOnEbyStats } from "../../types/taskStats/DealsOnEbyStats.js";
import { DailySalesReturnType } from "../../types/DailySalesReturnType.js";

export const crawlEbyListings = (
  ebay: Shop,
  task: DailySalesTask
): Promise<DailySalesReturnType> =>
  new Promise(async (res, rej) => {
    let infos: DealsOnEbyStats = {
      new: 0,
      total: 0,
      old: 0,
      notFound: 0,
      locked: 0,
      missingProperties: {
        bsr: 0,
        mappedCat: 0,
        calculationFailed: 0,
        name: 0,
        price: 0,
        link: 0,
        image: 0,
      },
      scrapeProducts: {
        elapsedTime: "",
      },
      ebyListings: {
        elapsedTime: "",
      },
      elapsedTime: "",
    };
    const { browserConfig, _id: taskId } = task;
    const { concurrency, productLimit } = browserConfig.crawlEbyListings;

    task.actualProductLimit = task.ebyListings.length;
    const queue = new QueryQueue(concurrency, proxyAuth, task);

    const eventEmitter = globalEventEmitter;

    eventEmitter.on(
      `${queue.queueId}-finished`,
      async function crawlEbyListingEventCallback() {
        await updateTask(taskId, { $set: { progress: task.progress } });
        await queue.disconnect(true);
        res({ infos, queueStats: queue.queueStats });
      }
    );

    await queue.connect();

    async function isProcessComplete() {
      if (infos.total === productLimit && !queue.idle()) {
        console.log("product limit reached");
        await updateTask(taskId, { $set: { progress: task.progress } });
        await queue.disconnect(true);
        res({ infos, queueStats: queue.queueStats });
      }
    }

    while (task.progress.ebyListings.length) {
      const product = task.ebyListings.pop();
      task.progress.ebyListings.pop();
      if (!product) continue;
      const { _id: productId, esin, s_hash } = product;

      const addProduct = async (
        product: Partial<Record<Content, string | number | boolean | string[]>>
      ) => {};
      const addProductInfo = async ({
        productInfo,
        url,
      }: AddProductInfoProps) => {
        await handleEbyListingProductInfo(
          salesDbName,
          infos,
          { productInfo, url },
          product,
          queue,
          { timestamp: "dealEbyUpdatedAt", taskIdProp: "dealEbyTaskId" }
        );
        await isProcessComplete();
      };
      const handleNotFound = async (cause: NotFoundCause) => {
        console.log("not found at all");
        infos.notFound++;
        infos.total++;
        queue.total++;
        await handleEbyListingNotFound(salesDbName, productId);
        await isProcessComplete();
      };

      let ebyLink = "https://www.ebay.de/itm/" + esin;

      queue.pushTask(queryProductPageQueue, {
        retries: 0,
        shop: ebay,
        addProduct,
        requestId: uuid(),
        s_hash,
        onNotFound: handleNotFound,
        addProductInfo,
        queue,
        query: defaultQuery,
        prio: 0,
        extendedLookUp: false,
        pageInfo: {
          link: ebyLink,
          name: ebay.d,
        },
      });
    }
  });
