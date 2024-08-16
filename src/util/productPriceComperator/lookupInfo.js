import {
  generateUpdate,
  getManufacturer,
  globalEventEmitter,
  prefixLink,
  QueryQueue,
  querySellerInfosQueue,
  replaceAllHiddenCharacters,
  yieldQueues,
} from "@dipmaxtech/clr-pkg";
import { DEFAULT_CHECK_PROGRESS_INTERVAL, proxyAuth } from "../../constants.js";
import { createOrUpdateArbispotterProduct } from "../../services/db/util/createOrUpdateArbispotterProduct.js";
import { upsertAsin } from "../../services/db/util/asinTable.js";
import { updateCrawlDataProduct } from "../../services/db/util/crudCrawlDataProduct.js";
import { updateArbispotterProduct } from "../../services/db/util/crudArbispotterProduct.js";
import { salesDbName } from "../../services/productPriceComparator.js";
import {
  crawlDataInfoMissingUpdate,
  resetAznProduct,
} from "../../services/lookupInfo.js";
import { updateTask } from "../../services/db/util/tasks.js";

export const getMaxLoadQueue = (queues) => {
  const queueLoad = queues.map((queue) => queue.workload());
  const maxQueueLoad = Math.max(...queueLoad);
  const index = queueLoad.indexOf(maxQueueLoad);
  return queues[index];
};

export const lookupInfo = async (sellerCentral, origin, task) =>
  new Promise(async (res, rej) => {
    const { browserConfig, _id, shopDomain } = task;
    const { concurrency, productLimit, browserConcurrency } =
      browserConfig.lookupInfo;

    let infos = {
      total: 1,
      old: 0,
      new: 0,
      failedSave: 0,
      notFound: 0,
      locked: 0,
      shops: {},
      missingProperties: {},
    };
    const eventEmitter = globalEventEmitter;
    const queryQueues = [];
    const queuesWithId = {};
    task.actualProductLimit = task.lookupInfo.length;
    await Promise.all(
      Array.from({ length: browserConcurrency || 1 }, (v, k) => k + 1).map(
        async () => {
          const queue = new QueryQueue(concurrency, proxyAuth, task);
          queuesWithId[queue.queueId] = queue;
          queryQueues.push(queue);
          //@ts-ignore
          eventEmitter.on(
            `${queue.queueId}-finished`,
            async function lookupInfoCallback({ queueId }) {
              console.log("Emitter: Queue completed ", queueId);
              const maxQueue = getMaxLoadQueue(queryQueues);
              const tasks = maxQueue.pullTasksFromQueue();
              if (tasks) {
                console.log(
                  "adding",
                  tasks.length,
                  " tasks from ",
                  maxQueue.queueId,
                  "to ",
                  queueId
                );
                queuesWithId[queueId].addTasksToQueue(tasks);
              } else {
                console.log("no more tasks to distribute. Closing ", queueId);
                await queuesWithId[queueId].disconnect(true);
                const isDone = queryQueues.every((q) => q.workload() === 0);
                if (isDone) {
                  interval && clearInterval(interval);
                  await updateTask(_id, { $set: { progress: task.progress } });
                  res(infos);
                }
              }
            }
          );
          return queue.connect();
        }
      )
    );

    const queueIterator = yieldQueues(queryQueues);

    const completedProducts = [];
    let interval = setInterval(async () => {
      await updateTask(_id, {
        $pull: {
          "progress.lookupInfo": { _id: { $in: completedProducts } },
        },
      });
    }, DEFAULT_CHECK_PROGRESS_INTERVAL);

    while (task.progress.lookupInfo.length) {
      const crawlDataProduct = task.lookupInfo.pop();
      task.progress.lookupInfo.pop();
      if (!crawlDataProduct) continue;
      const queue = queueIterator.next().value;
      const hasEan = origin.hasEan || origin?.ean;
      const {
        name,
        category: ctgry,
        ean,
        asin,
        hasMnfctr,
        mnfctr: manufacturer,
        price,
        uprc,
        qty,
        promoPrice,
        image,
        link: crawlDataProductLink,
        shop: s,
        a_qty: sellQty,
      } = crawlDataProduct;

      let mnfctr = "";
      let prodNm = "";

      if (hasMnfctr && manufacturer) {
        mnfctr = manufacturer;
        prodNm = name;
      } else {
        const { mnfctr: _mnfctr, prodNm: _prodNm } = getManufacturer(name);
        mnfctr = _mnfctr;
        prodNm = _prodNm;
      }

      let procProd = {
        ctgry,
        mnfctr,
        nm: prodNm,
        img: prefixLink(image, s),
        lnk: prefixLink(crawlDataProductLink, s),
        s_hash: crawlDataProduct.s_hash,
        prc: promoPrice ? promoPrice : price,
        uprc,
        shop: shopDomain,
        qty,
      };
      const { prc: buyPrice, qty: buyQty } = procProd;
      const addProduct = async (product) => {};
      const addProductInfo = async ({ productInfo, url }) => {
        completedProducts.push(crawlDataProduct._id);
        infos.shops[shopDomain]++;
        infos.total++;
        queue.total++;
        if (productInfo) {
          const processedProductUpdate = generateUpdate(
            productInfo,
            buyPrice,
            sellQty ?? 1,
            buyQty ?? 1
          );

          if (hasEan && ean) {
            await upsertAsin(
              processedProductUpdate.asin,
              [ean],
              processedProductUpdate.costs
            );
            processedProductUpdate["eanList"] = [ean];
          }
          processedProductUpdate["a_nm"] = replaceAllHiddenCharacters(
            processedProductUpdate["a_nm"]
          );
          processedProductUpdate["a_orgn"] = "a";
          processedProductUpdate["a_pblsh"] = true;

          const crawlDataProductUpdate = {
            info_locked: false,
            info_taskId: "",
            qty_prop: "",
            a_qty: processedProductUpdate.a_qty,
            info_prop: "complete",
            costs: processedProductUpdate.costs,
            asin: processedProductUpdate.asin,
          };
          const updatedProduct = {
            ...procProd,
            ...processedProductUpdate,
            aznUpdatedAt: new Date().toISOString(),
          };

          const result = await createOrUpdateArbispotterProduct(
            salesDbName,
            updatedProduct
          );
          if (result.acknowledged) {
            if (result.upsertedId) infos.new++;
            else infos.old++;
          } else {
            infos.failedSave++;
          }
          await updateCrawlDataProduct(
            salesDbName,
            crawlDataProductLink,
            crawlDataProductUpdate
          );
        } else {
          infos.missingProperties[shopDomain].hashes.push(
            crawlDataProduct.s_hash
          );
          await updateArbispotterProduct(
            salesDbName,
            crawlDataProductLink,
            resetAznProduct()
          );
          await updateCrawlDataProduct(
            salesDbName,
            crawlDataProductLink,
            crawlDataInfoMissingUpdate
          );
        }
        if (infos.total === productLimit) {
          interval && clearInterval(interval);
          await updateTask(_id, { $set: { progress: task.progress } });
          await Promise.all(queryQueues.map((queue) => queue.disconnect(true)));
          res(infos);
        }
      };
      const handleNotFound = async () => {
        completedProducts.push(crawlDataProduct._id);
        infos.notFound++;
        infos.shops[shopDomain]++;
        infos.total++;
        queue.total++;
        await updateArbispotterProduct(
          salesDbName,
          crawlDataProductLink,
          resetAznProduct()
        );
        await updateCrawlDataProduct(
          salesDbName,
          crawlDataProductLink,
          crawlDataInfoMissingUpdate
        );
        if (infos.total === productLimit) {
          interval && clearInterval(interval);
          await updateTask(_id, { $set: { progress: task.progress } });
          await Promise.all(queryQueues.map((queue) => queue.disconnect(true)));
          res(infos);
        }
      };
      queue.pushTask(querySellerInfosQueue, {
        retries: 0,
        shop: sellerCentral,
        targetShop: {
          prefix: "",
          d: shopDomain,
          name: shopDomain,
        },
        addProduct,
        lookupRetryLimit: 0,
        onNotFound: handleNotFound,
        addProductInfo,
        queue,
        query: {
          product: {
            value: hasEan ? ean : asin,
            key: hasEan ? ean : asin,
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
