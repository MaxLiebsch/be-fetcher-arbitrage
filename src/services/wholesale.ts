import {
  QueryQueue,
  generateUpdate,
  querySellerInfosQueue,
  yieldQueues,
  globalEventEmitter,
  uuid,
  AddProductInfoProps,
  ProductRecord,
  NotFoundCause,
} from "@dipmaxtech/clr-pkg";
import _ from "underscore";
import { handleResult } from "../handleResult";
import { MissingProductsError, MissingShopError } from "../errors";
import { getShop } from "../db/util/shops";
import {
  CONCURRENCY,
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  proxyAuth,
} from "../constants";
import { checkProgress } from "../util/checkProgress";
import {
  lockWholeSaleProducts,
  updateWholeSaleProduct,
} from "../db/util/wholesaleSearch/crudWholeSaleSearch";
import { updateWholesaleProgress } from "../util/updateProgressInTasks";
import { upsertAsin } from "../db/util/asinTable";
import { WholeSaleTask } from "../types/tasks/Tasks";
import { getMaxLoadQueue } from "../util/getMaxLoadQueue";
import { WholeSaleStats } from "../types/taskStats/WholeSaleStats";
import { TaskReturnType } from "../types/TaskReturnType";
import { getProductLimitMulti } from "../util/getProductLimit";
import { log } from "../util/logger";
import { multiQueueInitializer } from "../util/multiQueueInitializer";
import { TaskCompletedStatus } from "../status";
import { countRemainingProductsShop } from "../util/countRemainingProducts";
import { wholesaleCollectionName } from "../db/mongo";

export default async function wholesale(task: WholeSaleTask): TaskReturnType {
  return new Promise(async (resolve, reject) => {
    const { productLimit, _id: taskId, action, userId, type } = task;

    const wholeSaleProducts = await lockWholeSaleProducts(
      productLimit,
      taskId,
      action || "none"
    );

    if (action === "recover") {
      log(`Recovering ${type} and found ${wholeSaleProducts.length} products`);
    } else {
      log(`Starting ${type} with ${wholeSaleProducts.length} products`);
    }

    let infos: WholeSaleStats = {
      total: 0,
      locked: 0,
      new: 0,
      old: 0,
      missingProperties: {
        costs: 0,
        price: 0,
        infos: 0,
      },
      notFound: 0,
      elapsedTime: "",
      failedSave: 0,
    };

    if (!wholeSaleProducts.length)
      return reject(new MissingProductsError(`No products`, task));

    const _productLimit = getProductLimitMulti(
      wholeSaleProducts.length,
      productLimit
    );
    log(`Product limit: ${_productLimit}`);

    task.actualProductLimit = _productLimit;

    infos.locked = wholeSaleProducts.length;

    //Update task progress
    await updateWholesaleProgress(taskId);

    const startTime = Date.now();

    const toolInfo = await getShop("sellercentral.amazon.de");

    if (!toolInfo) {
      return reject(
        new MissingShopError(`No shop found for sellercentral.amazon.de`, task)
      );
    }

    const queues: QueryQueue[] = [];
    const queuesWithId: { [key: string]: QueryQueue } = {};
    const eventEmitter = globalEventEmitter;
    await multiQueueInitializer(task, queuesWithId, queues, eventEmitter);

    const queueIterator = yieldQueues(queues);

    const isCompleted = async () => {
      const isDone = queues.every((q) => q.workload() === 0);
      if (isDone) {
        const check = await checkProgress({
          task,
          queue: queues,
          infos,
          startTime,
          productLimit: _productLimit,
        });
        if (check instanceof TaskCompletedStatus) {
          const remaining = await countRemainingProductsShop(
            wholesaleCollectionName,
            taskId,
            type
          );
          log(`Remaining products: ${remaining}`);
          clearInterval(interval);
          await updateWholesaleProgress(taskId);
          handleResult(check, resolve, reject);
        }
      }
    };

    const interval = setInterval(
      async () => await isCompleted(),
      DEFAULT_CHECK_PROGRESS_INTERVAL
    );

    for (let index = 0; index < wholeSaleProducts.length; index++) {
      const queue = queueIterator.next().value;
      const wholesaleProduct = wholeSaleProducts[index];
      const {
        ean,
        _id: productId,
        prc,
        a_qty: sellQty,
        qty: buyQty,
      } = wholesaleProduct;

      //not needed, I swear I will write clean code
      const addProduct = async (product: ProductRecord) => {};
      const addProductInfo = async ({
        productInfo,
        url,
      }: AddProductInfoProps) => {
        infos.total++;
        queue.total++;
        if (productInfo) {
          try {
            const productUpdate = generateUpdate(
              productInfo,
              prc,
              buyQty || 1,
              sellQty || 1
            );

            let reducedCosts = { ...productUpdate.costs };
            delete reducedCosts.azn;
            await upsertAsin(productUpdate.asin, [ean], reducedCosts);
            const result = await updateWholeSaleProduct(productId, {
              ...productUpdate,
              status: "complete",
              lookup_pending: false,
              locked: false,
              clrName: "",
            });
            log(`Updated: ${ean}`, result);
            if (result.acknowledged) {
              if (result.upsertedId) infos.new++;
              else infos.old++;
            } else {
              infos.failedSave++;
            }
          } catch (error) {
            if (error instanceof Error) {
              if (error.message === "a_prc is 0") {
                infos.missingProperties.price++;
              }
              if (error.message === "costs.azn is 0") {
                infos.missingProperties.costs++;
              }
              const result = await updateWholeSaleProduct(productId, {
                status: "not found",
                lookup_pending: false,
                locked: false,
                clrName: "",
              });
              log(`Not found: ${ean}`, result);
              if (result.acknowledged) {
                if (result.upsertedId) infos.new++;
                else infos.old++;
              } else {
                infos.failedSave++;
              }
            }
          }
        } else {
          const result = await updateWholeSaleProduct(productId, {
            status: "not found",
            lookup_pending: false,
            locked: false,
            clrName: "",
          });
          log(`Product info missing: ${ean}`, result);
          if (result.acknowledged) {
            if (result.upsertedId) infos.new++;
            else infos.old++;
          } else {
            infos.failedSave++;
          }
        }
        await isCompleted();
      };

      const handleNotFound = async (cause: NotFoundCause) => {
        infos.notFound++;
        infos.total++;
        queue.total++;
        const result = await updateWholeSaleProduct(productId, {
          status: "not found",
          lookup_pending: false,
          locked: false,
          clrName: "",
        });
        log(`Not found: ${ean} - ${cause}`, result);
        if (result.acknowledged) {
          if (result.upsertedId) infos.new++;
          else infos.old++;
        } else {
          infos.failedSave++;
        }
        await isCompleted();
      };

      queue.pushTask(querySellerInfosQueue, {
        retries: 0,
        shop: toolInfo,
        requestId: uuid(),
        s_hash: productId.toString(),
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
