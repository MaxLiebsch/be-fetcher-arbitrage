import {
  AddProductInfoProps,
  NotFoundCause,
  ProductRecord,
  QueryQueue,
  queryProductPageQueue,
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
import { updateProgressInLookupCategoryTask } from "../util/updateProgressInTasks";
import { lookForMissingEbyCategory } from "../db/util/lookupCategory/lookForMissingEbyCategory";
import { getShop } from "../db/util/shops";
import {
  handleLookupCategoryNotFound,
  handleLookupCategoryProductInfo,
} from "../util/lookupCategoryHelper";
import { getProductLimit } from "../util/getProductLimit";
import { TaskCompletedStatus } from "../status";
import { LookupCategoryTask } from "../types/tasks/Tasks";
import { LookupCategoryStats } from "../types/taskStats/LookupCategoryStats";
import { TaskReturnType } from "../types/TaskReturnType";

async function lookupCategory(task: LookupCategoryTask):TaskReturnType {
  return new Promise(async (resolve, reject) => {
    const { productLimit, _id, action,  type } = task;

    let infos: LookupCategoryStats = {
      total: 0,
      notFound: 0,
      locked: 0,
      shops: {},
      elapsedTime: "",
    };

    const { products: products, shops } = await lookForMissingEbyCategory(
      _id,
      action || "none",
      productLimit
    );

    shops.forEach(async (info) => {
      infos.shops[info.shop.d] = 0;
    });

    if (!products.length)
      return reject(new MissingProductsError(`No products ${type}`, task));

    const _productLimit = getProductLimit(products.length, productLimit);
    task.actualProductLimit = _productLimit;

    infos.locked = products.length;

    await updateProgressInLookupCategoryTask(); // update lookup category task

    const startTime = Date.now();

    const toolInfo = await getShop("ebay.de");

    if (!toolInfo) {
      return reject(new MissingShopError("ebay.de", task));
    }

    const queue = new QueryQueue(
      task?.concurrency ? task.concurrency : CONCURRENCY,
      proxyAuth,
      task
    );
    queue.total = 0;
    await queue.connect();

    const isCompleted = async () => {
      const check = await checkProgress({
        task,
        queue,
        infos,
        startTime,
        productLimit: _productLimit,
      });
      if (check instanceof TaskCompletedStatus) {
        clearInterval(interval);
        handleResult(check, resolve, reject);
        await updateProgressInLookupCategoryTask(); // update lookup category task
      }
    };

    const interval = setInterval(
      async () => await isCompleted(),
      DEFAULT_CHECK_PROGRESS_INTERVAL
    );

    for (let index = 0; index < products.length; index++) {
      let { shop: srcShop, product } = products[index];
      const { lnk: productLink, esin, s_hash } = product;

      const queryUrl = "https://www.ebay.de/itm/" + esin;

      const shopDomain = srcShop.d;

      const addProduct = async (product: ProductRecord) => {};
      const addProductInfo = async ({
        productInfo,
        url,
      }: AddProductInfoProps) => {
        await handleLookupCategoryProductInfo(
          shopDomain,
          Boolean(srcShop.hasEan || srcShop.ean),
          { productInfo, url },
          queue,
          infos,
          product
        );
        await isCompleted();
      };
      const handleNotFound = async (cause: NotFoundCause) => {
        await handleLookupCategoryNotFound(
          shopDomain,
          infos,
          queue,
          productLink,
          cause
        );
        await isCompleted();
      };

      queue.pushTask(queryProductPageQueue, {
        retries: 0,
        shop: toolInfo,
        s_hash,
        requestId: uuid(),
        addProduct,
        targetShop: {
          name: shopDomain,
          d: shopDomain,
          prefix: "",
        },
        onNotFound: handleNotFound,
        addProductInfo,
        queue,
        query: defaultQuery,
        prio: 0,
        extendedLookUp: false,
        limit: undefined,
        prodInfo: undefined,
        isFinished: undefined,
        pageInfo: {
          link: queryUrl,
          name: srcShop.d,
        },
      });
    }
  });
}

export default lookupCategory;
