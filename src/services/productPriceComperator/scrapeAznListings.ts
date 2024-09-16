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
import { defaultQuery, proxyAuth } from "../../constants";
import { updateTask } from "../../db/util/tasks";
import {
  handleAznListingNotFound,
  handleAznListingProductInfo,
} from "../../util/scrapeAznListingsHelper";
import { salesDbName } from "../../db/mongo";
import { DailySalesTask } from "../../types/tasks/DailySalesTask";
import { DealsOnAznStats } from "../../types/taskStats/DealsOnAznStats.js";
import { DailySalesReturnType } from "../../types/DailySalesReturnType";

export const scrapeAznListings = (
  amazon: Shop,
  origin: Shop,
  task: DailySalesTask
): Promise<DailySalesReturnType> =>
  new Promise(async (res, rej) => {
    const { browserConfig, _id: taskId } = task;
    const { concurrency, productLimit } = browserConfig.crawlAznListings;

    let infos: DealsOnAznStats = {
      new: 0,
      total: 0,
      old: 0,
      notFound: 0,
      locked: 0,
      scrapeProducts: {
        elapsedTime: "",
      },
      aznListings: {
        elapsedTime: "",
      },
      missingProperties: {
        bsr: 0,
        mappedCat: 0,
        aznCostNeg: 0,
        infos: 0,
        calculationFailed: 0,
        name: 0,
        price: 0,
        link: 0,
        image: 0,
      },
      elapsedTime: "",
    };

    task.actualProductLimit = task.aznListings.length;
    const queue = new QueryQueue(concurrency, proxyAuth, task);
    await queue.connect();
    const eventEmitter = globalEventEmitter;

    eventEmitter.on(
      `${queue.queueId}-finished`,
      async function lookupCategoryCallback() {
        await isProcessComplete();
      }
    );
    const isProcessComplete = async () => {
      if (infos.total >= productLimit && !queue.idle()) {
        await updateTask(taskId, { $set: { progress: task.progress } });
        await queue.disconnect(true);
        res({ infos, queueStats: queue.queueStats });
      }
    };

    while (task.progress.aznListings.length) {
      task.progress.aznListings.pop();
      const product = task.aznListings.pop();
      if (!product) continue;
      const { _id: productId, asin, s_hash } = product;
      const addProduct = async (
        product: Partial<Record<Content, string | number | boolean | string[]>>
      ) => {};
      const addProductInfo = async ({
        productInfo,
        url,
      }: AddProductInfoProps) => {
        await handleAznListingProductInfo(
          salesDbName,
          product,
          { productInfo, url },
          infos,
          queue,
          { timestamp: "dealAznUpdatedAt", taskIdProp: "dealAznTaskId" }
        );
        await isProcessComplete();
      };
      const handleNotFound = async (cause: NotFoundCause) => {
        infos.notFound++;
        infos.total++;
        queue.total++;
        await handleAznListingNotFound(salesDbName, productId);
        await isProcessComplete();
      };

      let aznLink =
        "https://www.amazon.de/dp/product/" + asin + "?language=de_DE";

      queue.pushTask(queryProductPageQueue, {
        retries: 0,
        shop: amazon,
        requestId: uuid(),
        s_hash,
        addProduct,
        onNotFound: handleNotFound,
        addProductInfo,
        queue,
        query: defaultQuery,
        prio: 0,
        extendedLookUp: false,
        pageInfo: {
          link: aznLink,
          name: amazon.d,
        },
      });
    }
  });
