import {
  generateUpdate,
  globalEventEmitter,
  QueryQueue,
  querySellerInfosQueue,
  yieldQueues,
} from "@dipmaxtech/clr-pkg";
import { getMaxLoadQueue } from "./lookupInfo.js";
import { proxyAuth } from "../../constants.js";
import { updateCrawlDataProduct } from "../../services/db/util/crudCrawlDataProduct.js";
import { updateArbispotterProduct } from "../../services/db/util/crudArbispotterProduct.js";
import { resetAznProduct } from "../../services/lookupInfo.js";
import { upsertAsin } from "../../services/db/util/asinTable.js";
import { salesDbName } from "../../services/productPriceComparator.js";
import { updateTask } from "../../services/db/util/tasks.js";

export const crawlAznListings = (sellerCentral, origin, task) =>
  new Promise(async (res, rej) => {
    const { browserConfig, _id, shopDomain } = task;
    const { concurrency, productLimit, browserConcurrency } =
      browserConfig.crawlAznListings;

    let infos = {
      new: 0,
      total: 1,
      old: 0,
      notFound: 0,
      locked: 0,
      missingProperties: {
        bsr: 0,
        name: 0,
        price: 0,
        link: 0,
        image: 0,
      },
    };
    
    const queues = [];
    
    task.actualProductLimit = task.aznListings.length
    await Promise.all(
      Array.from({ length: browserConcurrency || 1 }, (v, k) => k + 1).map(
        async () => {
          const queue = new QueryQueue(concurrency, proxyAuth, task);
          queues.push(queue);
          return queue.connect();
        }
      )
    );
    const queuesWithId = queues.reduce((acc, queue) => {
      acc[queue.queueId] = queue;
      return acc;
    }, {});

    const eventEmitter = globalEventEmitter;
    queues.map((queue) => {
      //@ts-ignore
      eventEmitter.on(`${queue.queueId}-finished`, async ({ queueId }) => {
        console.log("Emitter: Queue completed ", queueId);
        const maxQueue = getMaxLoadQueue(queues);
        const tasks = maxQueue.pullTasksFromQueue();
        if (tasks) {
          console.log("adding tasks to queue: ", queueId, tasks.length);
          queuesWithId[queueId].addTasksToQueue(tasks);
        } else {
          console.log("no more tasks to distribute. Closing ", queueId);
          await queuesWithId[queueId].disconnect(true);
        }
      });
    });

    const queueIterator = yieldQueues(queues);
    while (task.progress.aznListings.length) {
      task.progress.aznListings.pop();
      const crawlDataProduct = task.aznListings.pop();
      if (!crawlDataProduct) continue;
      const queue = queueIterator.next().value;
      const {
        link: productLink,
        asin,
        ean,
        uprc: unitPrice,
        price: buyPrice,
        a_qty,
        qty,
      } = crawlDataProduct;

      const addProduct = async (product) => {};
      const addProductInfo = async ({ productInfo, url }) => {
        infos.total++;
        queue.total++;
        if (productInfo) {
          const processedProductUpdate = generateUpdate(
            productInfo,
            buyPrice,
            a_qty ?? 1,
            qty ?? 1
          );
          let eanList = [];
          if (origin.hasEan || origin.eanSelector) {
            eanList = [ean];
          }
          await upsertAsin(asin, eanList, processedProductUpdate.costs);

          const arbispotterProductUpdate = { ...processedProductUpdate };

          const crawlDataProductUpdate = {
            aznUpdatedAt: new Date().toISOString(),
            azn_locked: false,
            azn_taskId: "",
          };

          await updateArbispotterProduct(
            salesDbName,
            productLink,
            arbispotterProductUpdate
          );
          await updateCrawlDataProduct(
            salesDbName,
            productLink,
            crawlDataProductUpdate
          );
        } else {
          infos.missingProperties.bsr++;
          await updateCrawlDataProduct(salesDbName, productLink, {
            azn_locked: false,
            azn_taskId: "",
          });
        }
        if (infos.total === productLimit && !queue.idle()) {
          console.log("infos:", infos.total, "limit: ", productLimit);
          await updateTask(_id, { $set: { progress: task.progress } });
          await Promise.all(queues.map((queue) => queue.disconnect(true)));
          res(infos);
        }
      };
      const handleNotFound = async () => {
        infos.notFound++;
        infos.total++;
        queue.total++;
        await updateCrawlDataProduct(salesDbName, productLink, {
          azn_locked: false,
          azn_taskId: "",
          asin: "",
          a_qty: 0,
          info_prop: "", // reset lookup info to start over
        });
        await updateArbispotterProduct(
          salesDbName,
          productLink,
          resetAznProduct()
        );
        if (infos.total === productLimit && !queue.idle()) {
          console.log("infos:", infos.total, "limit: ", productLimit);
          await updateTask(_id, { $set: { progress: task.progress } });
          await Promise.all(queues.map((queue) => queue.disconnect(true)));
          res(infos);
        }
      };

      queue.pushTask(querySellerInfosQueue, {
        retries: 0,
        shop: sellerCentral,
        addProduct,
        targetShop: {
          prefix: "",
          d: shopDomain,
          name: shopDomain,
        },
        onNotFound: handleNotFound,
        addProductInfo,
        queue,
        query: {
          product: {
            value: asin,
            key: asin,
          },
        },
        prio: 0,
        extendedLookUp: false,
        pageInfo: {
          link: sellerCentral.entryPoints[0].url,
          name: sellerCentral.d,
        },
      });
    }
  });
