import {
  globalEventEmitter,
  queryProductPageQueue,
  QueryQueue,
} from "@dipmaxtech/clr-pkg";
import { updateTask } from "../../services/db/util/tasks.js";
import { defaultQuery, proxyAuth } from "../../constants.js";

export const scrapeProductInfo = async (task, products) =>
  new Promise(async (res, rej) => {
    const { browserConfig, _id, shopDomain } = task;
    const { concurrency, productLimit } = browserConfig.crawlEan;
    let infos = {
      total: 1,
      notFound: 0,
      locked: 0,
      shops: {},
      missingProperties: {
        [shopDomain]: {
          ean: 0,
          image: 0,
          hashes: [],
        },
      },
    };

    task.actualProductLimit = task.crawlEan.length;
    const queue = new QueryQueue(concurrency, proxyAuth, task);
    const eventEmitter = globalEventEmitter;

    eventEmitter.on(
      `${queue.queueId}-finished`,
      async function crawlEanCallback() {
        await resolveProcess();
      }
    );

    const resolveProcess = async () => {
      await updateTask(_id, { $set: { progress: task.progress } });
      await queue.disconnect(true);
      res(infos);
    };

    const isProcessCompleted = async () => {
      if (infos.total === productLimit && !queue.idle()) {
        await resolveProcess();
      }
    };
    await queue.connect();

    for (let index = 0; index < products.length; index++) {
      const { product, shop } = products[index];
      let { link: crawlDataProductLink, _id: productId } = product;

      const addProduct = async (product) => {};
      const addProductInfo = async ({ productInfo, url }) => {
        infos.shops[shopDomain]++;
        infos.total++;
        queue.total++;
        if (productInfo) {
          const infoMap = new Map();
          productInfo.forEach((info) => infoMap.set(info.key, info.value));
        } else {
        }
        await isProcessCompleted();
      };
      const handleNotFound = async (cause) => {
        infos.notFound++;
        infos.total++;
        queue.total++;
        await isProcessCompleted();
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
        addProductInfo,
        queue: queue,
        query: defaultQuery,
        prio: 0,
        extendedLookUp: false,
        pageInfo: {
          link: crawlDataProductLink,
          name: shop.d,
        },
      });
    }
  });
