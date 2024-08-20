import {
  QueryQueue,
  generateUpdate,
  globalEventEmitter,
  querySellerInfosQueue,
  replaceAllHiddenCharacters,
  yieldQueues,
} from "@dipmaxtech/clr-pkg";
import _ from "underscore";
import { handleResult } from "../handleResult.js";
import { MissingProductsError } from "../errors.js";
import { CONCURRENCY, proxyAuth } from "../constants.js";
import { checkProgress } from "../util/checkProgress.js";
import { upsertAsin } from "./db/util/asinTable.js";
import { lookForUnmatchedEans } from "./db/util/lookupInfo/lookForUnmatchedEans.js";
import { getShop } from "./db/util/shops.js";
import { updateProgressInLookupInfoTask } from "../util/updateProgressInTasks.js";
import { updateArbispotterProductQuery } from "./db/util/crudArbispotterProduct.js";
import { getMaxLoadQueue } from "../util/productPriceComperator/lookupInfo.js";
import { resetAznProductQuery } from "./db/util/aznQueries.js";

export default async function lookupInfo(task) {
  return new Promise(async (resolve, reject) => {
    const { productLimit, _id, action, type, browserConcurrency, concurrency } =
      task;

    let infos = {
      total: 1,
      old: 0,
      new: 0,
      failedSave: 0,
      notFound: 0,
      locked: 0,
      shops: {},
      missingProperties: {
        infos: 0,
        costs: 0,
      },
    };

    const { products, shops } = await lookForUnmatchedEans(
      _id,
      action,
      productLimit
    );

    shops.forEach(async (info) => {
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
                  await isProcessComplete(queue);
                }
              }
            }
          );
          queryQueues.push(queue);
          return queue.connect();
        }
      )
    );

    async function isProcessComplete(queue) {
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
    }

    const queueIterator = yieldQueues(queryQueues);

    for (let index = 0; index < products.length; index++) {
      const queue = queueIterator.next().value;
      const { product, shop } = products[index];
      const shopDomain = shop.d;
      const hasEan = shop.hasEan || shop?.ean;
      const {
        ean,
        asin,
        prc: buyPrice,
        qty: buyQty,
        a_qty: sellQty,
        lnk: productLink,
      } = product;

      const addProduct = async (product) => {};
      const addProductInfo = async ({ productInfo, url }) => {
        if (productInfo) {
          const processedProductUpdate = generateUpdate(
            productInfo,
            buyPrice,
            sellQty || 1,
            buyQty || 1
          );
          const { costs, a_nm, asin } = processedProductUpdate;

          if (costs.azn > 0) {
            processedProductUpdate["a_nm"] = replaceAllHiddenCharacters(a_nm);
            processedProductUpdate["a_orgn"] = "a";
            processedProductUpdate["a_pblsh"] = true;
            if (hasEan && ean) {
              await upsertAsin(asin, [ean], costs);
              processedProductUpdate["eanList"] = [ean];
            }

            await updateArbispotterProductQuery(shopDomain, productLink, {
              $set: {
                ...processedProductUpdate,
                info_prop: "complete",
                aznUpdatedAt: new Date().toISOString(),
                infoUpdatedAt: new Date().toISOString(),
              },
              $unset: { info_taskId: "" },
            });
          } else {
            infos.missingProperties.costs++;
            await updateArbispotterProductQuery(shopDomain, productLink, {
              $set: {
                info_prop: "missing",
                infoUpdatedAt: new Date().toISOString(),
              },
              $unset: { info_taskId: "" },
            });
          }
        } else {
          infos.missingProperties.infos++;
          await updateArbispotterProductQuery(
            shopDomain,
            productLink,
            resetAznProductQuery({
              info_prop: "missing",
              infoUpdatedAt: new Date().toISOString(),
            })
          );
        }
        await isProcessComplete(queue);
        infos.shops[shopDomain]++;
        infos.total++;
        queue.total++;
      };
      const handleNotFound = async () => {
        infos.notFound++;
        const query = resetAznProductQuery({
          info_prop: "missing",
          infoUpdatedAt: new Date().toISOString(),
        });
        await updateArbispotterProductQuery(shopDomain, productLink, query);
        await isProcessComplete(queue);
        infos.shops[shopDomain]++;
        infos.total++;
        queue.total++;
      };

      const query = {
        product: {
          value: hasEan ? asin || ean : asin,
          key: hasEan ? asin || ean : asin,
        },
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
        query,
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
