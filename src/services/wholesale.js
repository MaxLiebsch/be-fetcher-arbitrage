import {
  QueryQueue,
  generateUpdate,
  querySellerInfosQueue,
  yieldQueues,
} from "@dipmaxtech/clr-pkg";
import _ from "underscore";
import { handleResult } from "../handleResult.js";
import { MissingProductsError } from "../errors.js";
import { getShop } from "./db/util/shops.js";
import {
  CONCURRENCY,
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  proxyAuth,
} from "../constants.js";
import { checkProgress } from "../util/checkProgress.js";
import {
  lockWholeSaleProducts,
  updateWholeSaleProduct,
} from "./db/util/wholesaleSearch/crudWholeSaleSearch.js";
import { updateWholesaleProgress } from "../util/updateProgressInTasks.js";
import { upsertAsin } from "./db/util/asinTable.js";

export default async function wholesale(task) {
  return new Promise(async (resolve, reject) => {
    const {
      shopDomain,
      productLimit,
      _id,
      action,
      userId,
      browserConcurrency,
    } = task;

    const wholeSaleProducts = await lockWholeSaleProducts(
      productLimit,
      _id,
      action
    );

    let infos = {
      new: 0,
      total: 0,
      old: 0,
      failedSave: 0,
      locked: 0,
      missingProperties: {
        name: 0,
        price: 0,
        link: 0,
        image: 0,
      },
    };

    if (!wholeSaleProducts.length)
      return reject(
        new MissingProductsError(`No products for ${shopDomain}`, task)
      );

    const _productLimit =
      wholeSaleProducts.length < productLimit
        ? wholeSaleProducts.length
        : productLimit;

    infos.locked = wholeSaleProducts.length;

    //Update task progress
    await updateWholesaleProgress(_id, task.progress.total);

    const startTime = Date.now();

    const toolInfo = await getShop("sellercentral.amazon.de");

    const queues = [];

    await Promise.all(
      Array.from({ length: browserConcurrency ?? 1 }, (v, k) => k + 1).map(
        async () => {
          const queue = new QueryQueue(
            task?.concurrency ? task.concurrency : CONCURRENCY,
            proxyAuth,
            task
          );
          queues.push(queue);
          return queue.connect();
        }
      )
    );

    const queueIterator = yieldQueues(queues);

    const interval = setInterval(async () => {
      const isDone = queues.every((q) => q.workload() === 0);
      await updateWholesaleProgress(_id, task.progress.total);
      if (isDone) {
        await checkProgress({
          queue: queues,
          infos,
          startTime,
          productLimit,
        }).catch(async (r) => {
          clearInterval(interval);
          await updateWholesaleProgress(_id, task.progress.total);
          handleResult(r, resolve, reject);
        });
      }
    }, DEFAULT_CHECK_PROGRESS_INTERVAL);

    for (let index = 0; index < wholeSaleProducts.length; index++) {
      const queue = queueIterator.next().value;
      const wholesaleProduct = wholeSaleProducts[index];
      const { ean, _id, prc } = wholesaleProduct;

      //not needed, I swear I will write clean code
      const addProduct = async (product) => {};
      const addProductInfo = async ({ productInfo, url }) => {
        if (productInfo) {
          const processedProductUpdate = generateUpdate(productInfo, prc);
          await upsertAsin(processedProductUpdate.asin, [ean]);
          const result = await updateWholeSaleProduct(_id, {
            ...processedProductUpdate,
            status: "complete",
            lookup_pending: false,
            locked: false,
            clrName: "",
          });
          if (result.acknowledged) {
            if (result.upsertedId) infos.new++;
            else infos.old++;
          } else {
            infos.failedSave++;
          }
        } else {
          const result = await updateWholeSaleProduct(_id, {
            status: "not found",
            lookup_pending: false,
            locked: false,
            clrName: "",
          });
          if (result.acknowledged) {
            if (result.upsertedId) infos.new++;
            else infos.old++;
          } else {
            infos.failedSave++;
          }
        }
        if (infos.total >= _productLimit - 1 && !queue.idle()) {
          await checkProgress({
            queue: queues,
            infos,
            startTime,
            productLimit: _productLimit,
          }).catch(async (r) => {
            clearInterval(interval);
            await updateWholesaleProgress(_id, task.progress.total);
            handleResult(r, resolve, reject);
          });
        }
        infos.total++;
      };

      const handleNotFound = async () => {
        infos.notFound++;
        const result = await updateWholeSaleProduct(_id, {
          status: "not found",
          lookup_pending: false,
          locked: false,
          clrName: "",
        });
        if (result.acknowledged) {
          if (result.upsertedId) infos.new++;
          else infos.old++;
        } else {
          infos.failedSave++;
        }
        if (infos.total >= _productLimit - 1 && !queue.idle()) {
          await checkProgress({
            queue: queues,
            infos,
            startTime,
            productLimit: _productLimit,
          }).catch(async (r) => {
            clearInterval(interval);
            await updateWholesaleProgress(_id, task.progress.total);
            handleResult(r, resolve, reject);
          });
        }
        infos.total++;
      };

      queue.pushTask(querySellerInfosQueue, {
        retries: 0,
        shop: toolInfo,
        addProduct,
        targetShop: {
          prefix: "",
          d: `UserId: ${userId}`,
          name: `UserId: ${userId}`,
        },
        onNotFound: handleNotFound,
        addProductInfo,
        queue,
        query: {
          product: {
            value: ean,
            key: ean,
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
