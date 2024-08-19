import {
  QueryQueue,
  generateUpdate,
  getManufacturer,
  globalEventEmitter,
  prefixLink,
  querySellerInfosQueue,
  replaceAllHiddenCharacters,
  yieldQueues,
} from "@dipmaxtech/clr-pkg";
import _ from "underscore";

import { handleResult } from "../handleResult.js";
import { MissingProductsError } from "../errors.js";
import {
  CONCURRENCY,
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  proxyAuth,
} from "../constants.js";
import { checkProgress } from "../util/checkProgress.js";
import { updateCrawlDataProduct } from "./db/util/crudCrawlDataProduct.js";
import { upsertAsin } from "./db/util/asinTable.js";
import { lookForUnmatchedEans } from "./db/util/lookupInfo/lookForUnmatchedEans.js";
import { getShop } from "./db/util/shops.js";
import { updateProgressInLookupInfoTask } from "../util/updateProgressInTasks.js";
import { updateArbispotterProduct } from "./db/util/crudArbispotterProduct.js";
import {
  createOrUpdateArbispotterProduct,
  keepaProperties,
} from "./db/util/createOrUpdateArbispotterProduct.js";
import { createArbispotterCollection } from "./db/mongo.js";
import { getMaxLoadQueue } from "../util/productPriceComperator/lookupInfo.js";

export const resetAznProduct = () => {
  const update = {
    asin: "",
    a_pblsh: false,
    a_prc: 0,
    info_prop: "",
    aznUpdatedAt: "",
    dealAznUpdatedAt: "",
    keepaUpdatedAt: "",
    a_orgn: "",
    a_uprc: 0,
    a_qty: 0,
    a_lnk: "",
    a_img: "",
    a_hash: "",
    a_mrgn: 0,
    a_mrgn_pct: 0,
    a_w_mrgn: 0,
    a_w_mrgn_pct: 0,
    a_w_p_mrgn: 0,
    a_w_p_mrgn_pct: 0,
    a_p_mrgn: 0,
    a_p_mrgn_pct: 0,
    a_nm: "",
  };
  keepaProperties.forEach((prop) => {
    update[prop.name] = null;
  });
  return update;
};

export const crawlDataInfoMissingUpdate = {
  info_locked: false,
  info_prop: "missing",
  info_taskId: "",
  asin: "",
  a_qty: 0,
};

/*
  TODO
    transfer tasks between queues

*/

export default async function lookupInfo(task) {
  return new Promise(async (resolve, reject) => {
    const {
      productLimit,
      _id,
      action,
      proxyType,
      type,
      browserConcurrency,
      concurrency,
    } = task;

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

    const { products, shops } = await lookForUnmatchedEans(
      _id,
      proxyType,
      action,
      productLimit
    );

    shops.forEach(async (info) => {
      await createArbispotterCollection(info.shop.d);
      infos.shops[info.shop.d] = 0;
    });

    if (!products.length)
      return reject(new MissingProductsError(`No products ${type}`, task));

    const _productLimit =
      products.length < productLimit ? products.length : productLimit;
    task.actualProductLimit = _productLimit;

    const toolInfo = await getShop("sellercentral.amazon.de");

    infos.locked = products.length;

    //Update task progress
    await updateProgressInLookupInfoTask();

    const startTime = Date.now();

    const queryQueues = [];
    const queuesWithId = {};
    const eventEmitter = globalEventEmitter;

    await Promise.all(
      Array.from({ length: browserConcurrency || 1 }, (v, k) => k + 1).map(
        async () => {
          const queue = new QueryQueue(
            concurrency ? concurrency : CONCURRENCY,
            proxyAuth,
            task
          );
          queuesWithId[queue.queueId] = queue;
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
                  await checkProgress({
                    queue: queryQueues,
                    infos,
                    startTime,
                    productLimit: _productLimit,
                  }).catch(async (r) => {
                    await updateProgressInLookupInfoTask();
                    handleResult(r, resolve, reject);
                  });
                }
              }
            }
          );
          queryQueues.push(queue);
          return queue.connect();
        }
      )
    );

    const queueIterator = yieldQueues(queryQueues);

    for (let index = 0; index < products.length; index++) {
      const queue = queueIterator.next().value;
      const { product: crawlDataProduct, shop } = products[index];
      const shopDomain = shop.d;
      const hasEan = shop.hasEan || shop?.ean;
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
        qty,
      };
      const { prc: buyPrice, qty: buyQty } = procProd;
      const addProduct = async (product) => {};
      const addProductInfo = async ({ productInfo, url }) => {
        if (productInfo) {
          const processedProductUpdate = generateUpdate(
            productInfo,
            buyPrice,
            sellQty || 1,
            buyQty || 1
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
            shopDomain,
            updatedProduct
          );
          if (result.acknowledged) {
            if (result.upsertedId) infos.new++;
            else infos.old++;
          } else {
            infos.failedSave++;
          }
          await updateCrawlDataProduct(
            shopDomain,
            crawlDataProductLink,
            crawlDataProductUpdate
          );
        } else {
          infos.missingProperties[shopDomain].hashes.push(
            crawlDataProduct.s_hash
          );
          await updateArbispotterProduct(
            shopDomain,
            crawlDataProductLink,
            resetAznProduct()
          );
          await updateCrawlDataProduct(
            shopDomain,
            crawlDataProductLink,
            crawlDataInfoMissingUpdate
          );
        }
        if (infos.total === _productLimit && !queue.idle()) {
          await checkProgress({
            queue: queryQueues,
            infos,
            startTime,
            productLimit: _productLimit,
          }).catch(async (r) => {
            await updateProgressInLookupInfoTask();
            handleResult(r, resolve, reject);
          });
        }
        infos.shops[shopDomain]++;
        infos.total++;
        queue.total++;
      };
      const handleNotFound = async () => {
        infos.notFound++;
        await updateArbispotterProduct(
          shopDomain,
          crawlDataProductLink,
          resetAznProduct()
        );
        await updateCrawlDataProduct(
          shopDomain,
          crawlDataProductLink,
          crawlDataInfoMissingUpdate
        );
        if (infos.total === _productLimit && !queue.idle()) {
          await checkProgress({
            queue: queryQueues,
            infos,
            startTime,
            productLimit: _productLimit,
          }).catch(async (r) => {
            await updateProgressInLookupInfoTask();
            handleResult(r, resolve, reject);
          });
        }
        infos.shops[shopDomain]++;
        infos.total++;
        queue.total++;
      };
      queue.pushTask(querySellerInfosQueue, {
        retries: 0,
        shop: toolInfo,
        targetShop: {
          prefix: "",
          d: shopDomain,
          name: shopDomain,
        },
        addProduct,
        onNotFound: handleNotFound,
        addProductInfo,
        queue,
        query: {
          product: {
            value: hasEan ? asin || ean : asin,
            key: hasEan ? asin || ean : asin,
          },
        },
        prio: 0,
        extendedLookUp: false,
        pageInfo: {
          link: toolInfo.entryPoints[0].url,
          name: toolInfo.d,
        },
      });
    }
  });
}
