import {
  Content,
  NotFoundCause,
  Product,
  QueryQueue,
  queryEansOnEbyQueue,
  queryURLBuilder,
  uuid,
} from "@dipmaxtech/clr-pkg";
import _ from "underscore";

import { handleResult } from "../handleResult.js";
import { MissingProductsError, MissingShopError } from "../errors.js";
import { CONCURRENCY, defaultQuery, proxyAuth } from "../constants.js";
import { checkProgress } from "../util/checkProgress.js";
import {
  updateProgressInLookupCategoryTask,
  updateProgressInQueryEansOnEbyTask,
} from "../util/updateProgressInTasks.js";
import { getShop } from "../db/util/shops.js";
import {
  handleQueryEansOnEbyIsFinished,
  handleQueryEansOnEbyNotFound,
} from "../util/queryEansOnEbyHelper.js";
import { getProductLimitMulti } from "../util/getProductLimit.js";
import { getEanFromProduct } from "../util/getEanFromProduct.js";
import { updateProductWithQuery } from "../db/util/crudProducts.js";
import { TaskCompletedStatus } from "../status.js";
import { QueryEansOnEbyTask } from "../types/tasks/Tasks.js";
import { QueryEansOnEbyStats } from "../types/taskStats/QueryEansOnEbyStats.js";
import { TaskReturnType } from "../types/TaskReturnType.js";
import { log } from "../util/logger.js";
import { countRemainingProducts } from "../util/countRemainingProducts.js";
import { findPendingProductsForTask } from "../db/util/multiShopUtilities/findPendingProductsForTask.js";

export default async function queryEansOnEby(
  task: QueryEansOnEbyTask
): TaskReturnType {
  return new Promise(async (resolve, reject) => {
    const { productLimit, _id: taskId, action, type } = task;

    let infos: QueryEansOnEbyStats = {
      total: 0,
      notFound: 0,
      locked: 0,
      shops: {},
      missingProperties: {},
      elapsedTime: "",
    };

    const { products: productsWithShop, shops } =
      await findPendingProductsForTask(
        "QUERY_EANS_EBY",
        taskId,
        action || "none",
        productLimit
      );

    if (action === "recover") {
      log(`Recovering ${type} and found ${productsWithShop.length} products`);
    } else {
      log(`Starting ${type} with ${productsWithShop.length} products`);
    }

    shops.forEach(async (info) => {
      infos.shops[info.shop.d] = 0;
      infos.missingProperties[info.shop.d] = {
        ean: 0,
        image: 0,
      };
    });

    if (!productsWithShop.length)
      return reject(new MissingProductsError(`No products ${type}`, task));

    const _productLimit = getProductLimitMulti(
      productsWithShop.length,
      productLimit
    );
    const remaining = await countRemainingProducts(shops, taskId, type);
    log(`Product limit: ${_productLimit}, Remaining products: ${remaining}`);
    task.actualProductLimit = _productLimit;

    infos.locked = productsWithShop.length;

    //Update task progress
    await updateProgressInQueryEansOnEbyTask();

    const startTime = Date.now();

    const queue = new QueryQueue(
      task?.concurrency ? task.concurrency : CONCURRENCY,
      proxyAuth,
      task
    );
    queue.total = 0;
    await queue.connect();

    await updateProgressInQueryEansOnEbyTask(); // update query eans on eby task

    const toolInfo = await getShop("ebay.de");

    if(!toolInfo){
      return reject(new MissingShopError(`No shop found for ebay.de`, task));
    }

    const { proxyType } = toolInfo;

    if (!toolInfo) {
      return reject(new MissingShopError(`No shop found for ebay.de`, task));
    }

    async function isProcessComplete() {
      const check = await checkProgress({
        task,
        queue,
        infos,
        startTime,
        productLimit: _productLimit,
      });
      if (check instanceof TaskCompletedStatus) {
        const remaining = await countRemainingProducts(shops, taskId, type);
        log(`Remaining products: ${remaining}`);
        await updateProgressInQueryEansOnEbyTask(); // update query eans on eby task
        await updateProgressInLookupCategoryTask(); // update lookup category task
        handleResult(check, resolve, reject);
      }
    }

    for (let index = 0; index < productsWithShop.length; index++) {
      const { shop, product } = productsWithShop[index];
      const { s_hash, _id: productId } = product;

      const srcShopDomain = shop.d;
      const ean = getEanFromProduct(product);

      const foundProducts: Product[] = [];

      const addProduct = async (
        product: Partial<Record<Content, string | number | boolean | string[]>>
      ) => {
        foundProducts.push(product as Product);
      };
      const isFinished = async () => {
        await handleQueryEansOnEbyIsFinished(
          srcShopDomain,
          queue,
          product,
          infos,
          foundProducts
        );
        await isProcessComplete();
      };
      const handleNotFound = async (cause: NotFoundCause) => {
        if (cause === "exceedsLimit") {
          const result = await updateProductWithQuery(productId, {
            $unset: {
              eby_taskId: "",
            },
          });
          log(`ExceedsLimit: ${srcShopDomain}-${productId}`, result);
        } else {
          await handleQueryEansOnEbyNotFound(srcShopDomain, product);
        }
        infos.notFound++;
        infos.shops[shop.d]++;
        infos.total++;
        queue.total++;
        await isProcessComplete();
      };
      const query = {
        ...defaultQuery,
        product: {
          value: ean,
          key: ean,
        },
        category: "default",
      };
      if (!toolInfo.queryUrlSchema) {
        return reject(new Error("No queryUrlSchema found for ebay.de"));
      }
      const queryLink = queryURLBuilder(toolInfo.queryUrlSchema, query).url;

      queue.pushTask(queryEansOnEbyQueue, {
        retries: 0,
        requestId: uuid(),
        s_hash,
        proxyType,
        shop: toolInfo,
        targetShop: {
          prefix: "",
          d: srcShopDomain,
          name: srcShopDomain,
        },
        addProduct,
        isFinished,
        onNotFound: handleNotFound,
        queue,
        query,
        prio: 0,
        extendedLookUp: false,
        limit: undefined,
        pageInfo: {
          link: queryLink,
          name: toolInfo.d,
        },
      });
    }
  });
}
