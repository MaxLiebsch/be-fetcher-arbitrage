import {
  globalEventEmitter,
  queryProductPageQueue,
  QueryQueue,
  uuid,
} from "@dipmaxtech/clr-pkg";
import { defaultQuery, proxyAuth } from "../../constants.js";
import { updateTask } from "../../services/db/util/tasks.js";
import {
  handleEbyListingNotFound,
  handleEbyListingProductInfo,
} from "../../util/scrapeEbyListingsHelper.js";
import { salesDbName } from "../db/mongo.js";

export const crawlEbyListings = (ebay, task) =>
  new Promise(async (res, rej) => {
    let infos = {
      new: 0,
      total: 1,
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
    };
    const { browserConfig, _id, shopDomain } = task;
    const { concurrency, productLimit } = browserConfig.crawlEbyListings;

    task.actualProductLimit = task.ebyListings.length;
    const queue = new QueryQueue(concurrency, proxyAuth, task);

    const eventEmitter = globalEventEmitter;

    eventEmitter.on(
      `${queue.queueId}-finished`,
      async function crawlEbyListingEventCallback() {
        await updateTask(_id, { $set: { progress: task.progress } });
        await queue.disconnect(true);
        res(infos);
      }
    );

    await queue.connect();

    async function isProcessComplete() {
      if (infos.total === productLimit && !queue.idle()) {
        console.log("product limit reached");
        await updateTask(_id, { $set: { progress: task.progress } });
        await queue.disconnect(true);
        res(infos);
      }
    }

    while (task.progress.ebyListings.length) {
      const product = task.ebyListings.pop();
      task.progress.ebyListings.pop();
      if (!product) continue;
      const { link: productLink, esin, s_hash } = product;

      const addProduct = async (product) => {};
      const addProductInfo = async ({ productInfo, url }) => {
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
      const handleNotFound = async (cause) => {
        console.log("not found at all");
        infos.notFound++;
        infos.total++;
        queue.total++;
        await handleEbyListingNotFound(salesDbName, productLink);
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
