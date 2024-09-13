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

import { handleResult } from "../handleResult";
import { MissingProductsError, MissingShopError } from "../errors";
import {
  CONCURRENCY,
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  defaultQuery,
  proxyAuth,
} from "../constants";
import { checkProgress } from "../util/checkProgress";
import {
  updateProgressInLookupCategoryTask,
  updateProgressInQueryEansOnEbyTask,
} from "../util/updateProgressInTasks";
import { lookForUnmatchedQueryEansOnEby } from "../db/util/queryEansOnEby/lookForUnmatchedEansOnEby";
import { getShop } from "../db/util/shops";
import {
  handleQueryEansOnEbyIsFinished,
  handleQueryEansOnEbyNotFound,
} from "../util/queryEansOnEbyHelper";
import { getProductLimit } from "../util/getProductLimit";
import { getEanFromProduct } from "../util/getEanFromProduct";
import { updateArbispotterProductQuery } from "../db/util/crudArbispotterProduct";
import { TaskCompletedStatus } from "../status";
import { QueryEansOnEbyTask } from "../types/tasks/Tasks";
import { QueryEansOnEbyStats } from "../types/taskStats/QueryEansOnEbyStats";
import { TaskReturnType } from "../types/TaskReturnType";

export default async function queryEansOnEby(
  task: QueryEansOnEbyTask
): TaskReturnType {
  return new Promise(async (resolve, reject) => {
    const { productLimit, _id, action, type } = task;

    let infos: QueryEansOnEbyStats = {
      total: 1,
      notFound: 0,
      locked: 0,
      shops: {},
      missingProperties: {},
      elapsedTime: "",
    };

    const { products: productsWithShop, shops } =
      await lookForUnmatchedQueryEansOnEby(_id, action || "none", productLimit);

    shops.forEach(async (info) => {
      infos.shops[info.shop.d] = 0;
      infos.missingProperties[info.shop.d] = {
        ean: 0,
        image: 0,
      };
    });

    if (!productsWithShop.length)
      return reject(new MissingProductsError(`No products ${type}`, task));

    const _productLimit = getProductLimit(
      productsWithShop.length,
      productLimit
    );
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
    queue.total = 1;
    await queue.connect();

    await updateProgressInQueryEansOnEbyTask(); // update query eans on eby task

    const toolInfo = await getShop("ebay.de");

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
        clearInterval(interval);
        await updateProgressInQueryEansOnEbyTask(); // update query eans on eby task
        await updateProgressInLookupCategoryTask(); // update lookup category task
        handleResult(check, resolve, reject);
      }
    }
    const interval = setInterval(
      async () => await isProcessComplete(),
      DEFAULT_CHECK_PROGRESS_INTERVAL
    );

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
        if (cause === "timeout") {
          await updateArbispotterProductQuery(srcShopDomain, productId, {
            $unset: {
              eby_taskId: "",
            },
          });
        } else {
          await handleQueryEansOnEbyNotFound(
            srcShopDomain,
            infos,
            product,
            queue
          );
        }
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
      const queryLink = queryURLBuilder(toolInfo.queryUrlSchema, query).url;

      queue.pushTask(queryEansOnEbyQueue, {
        retries: 0,
        requestId: uuid(),
        s_hash,
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
