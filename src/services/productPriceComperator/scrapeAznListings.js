import {
  globalEventEmitter,
  queryProductPageQueue,
  QueryQueue,
} from "@dipmaxtech/clr-pkg";
import { defaultQuery, proxyAuth } from "../../constants.js";
import { salesDbName } from "../../services/productPriceComparator.js";
import { updateTask } from "../../services/db/util/tasks.js";
import {
  handleAznListingNotFound,
  handleAznListingProductInfo,
} from "../../util/scrapeAznListingsHelper.js";

export const scrapeAznListings = (amazon, origin, task) =>
  new Promise(async (res, rej) => {
    const { browserConfig, _id } = task;
    const { concurrency, productLimit } = browserConfig.crawlAznListings;

    let infos = {
      new: 0,
      total: 1,
      old: 0,
      notFound: 0,
      locked: 0,
      missingProperties: {
        aznPrice: {
          a_prc_test_3: 0,
          a_prc_test_2: 0,
          a_prc_test_1: 0,
          a_prc: 0,
        },
        bsr: 0,
        name: 0,
        link: 0,
        image: 0,
      },
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
        console.log("infos:", infos.total, "limit: ", productLimit);
        await updateTask(_id, { $set: { progress: task.progress } });
        await queue.disconnect(true);
        res(infos);
      }
    };

    while (task.progress.aznListings.length) {
      task.progress.aznListings.pop();
      const product = task.aznListings.pop();
      if (!product) continue;
      const { lnk: productLink, asin } = product;
      const addProduct = async (product) => {};
      const addProductInfo = async ({ productInfo, url }) => {
        await handleAznListingProductInfo(
          salesDbName,
          product,
          { productInfo, url },
          infos,
          queue,
          {timestamp: 'dealAznUpdatedAt', taskIdProp: "dealAznTaskId"}
        );
        await isProcessComplete();
      };
      const handleNotFound = async () => {
        infos.notFound++;
        infos.total++;
        queue.total++;
        await handleAznListingNotFound(salesDbName, productLink);
        await isProcessComplete();
      };

      let aznLink =
        "https://www.amazon.de/dp/product/" + asin + "?language=de_DE";

      queue.pushTask(queryProductPageQueue, {
        retries: 0,
        shop: amazon,
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
