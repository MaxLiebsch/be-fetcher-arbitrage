import {
  QueryQueue,
  queryTargetShops,
  standardTargetRetailerList,
  reduceString,
  matchTargetShopProdsWithRawProd,
  replaceAllHiddenCharacters,
  DbProductRecord,
} from "@dipmaxtech/clr-pkg";
import { shuffle } from "underscore";
import { handleResult } from "../handleResult.js";
import { MissingProductsError, MissingShopError } from "../errors.js";
import { getShop, getShops } from "../db/util/shops.js";
import {
  CONCURRENCY,
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  defaultQuery,
  proxyAuth,
} from "../constants.js";
import { checkProgress } from "../util/checkProgress.js";
import { parseAsinFromUrl } from "../util/parseAsin.js";
import {
  updateMatchProgress,
  updateProgressInLookupCategoryTask,
  updateProgressInLookupInfoTask,
} from "../util/updateProgressInTasks.js";
import { lockProductsForMatch } from "../db/util/match/lockProductsForMatch.js";
import { handleRelocateLinks } from "../util/handleRelocateLinks.js";
import { parseEsinFromUrl } from "../util/parseEsin.js";
import { updateArbispotterProductQuery } from "../db/util/crudArbispotterProduct.js";
import { getEanFromProduct } from "../util/getEanFromProduct.js";
import { TaskCompletedStatus } from "../status.js";
import { MatchProductsTask } from "../types/tasks/Tasks.js";
import { MatchProductsStats } from "../types/taskStats/MatchProductsStats.js";
import { TaskReturnType } from "../types/TaskReturnType.js";
import { getProductLimit } from "../util/getProductLimit.js";
import { log } from "../util/logger.js";
import { countRemainingProductsShop } from "../util/countRemainingProducts.js";

export default async function match(task: MatchProductsTask): TaskReturnType {
  return new Promise(async (resolve, reject) => {
    const {
      shopDomain,
      concurrency,
      productLimit,
      startShops,
      _id: taskId,
      action,
      type,
    } = task;

    const srcShop = await getShop(shopDomain);

    if (!srcShop) return reject(new MissingShopError("", task));

    const { hasEan, ean } = srcShop;

    const lockedProducts = await lockProductsForMatch(
      taskId,
      shopDomain,
      action || "none",
      Boolean(hasEan || ean),
      productLimit
    );

    if (action === "recover") {
      log(`Recovering ${type} and found ${lockedProducts.length} products`);
    } else {
      log(`Starting ${type} with ${lockedProducts.length} products`);
    }

    let infos: MatchProductsStats = {
      total: 0,
      notFound: 0,
      locked: 0,
      elapsedTime: "",
    };

    if (!lockedProducts.length)
      return reject(
        new MissingProductsError(`No products for ${shopDomain}`, task)
      );

    const _productLimit = getProductLimit(lockedProducts.length, productLimit);
    log(`Product limit: ${_productLimit}`);
    task.actualProductLimit = _productLimit;

    infos.locked = lockedProducts.length;

    //Update task progress
    await updateMatchProgress(shopDomain, hasEan);

    const startTime = Date.now();

    let targetShops = standardTargetRetailerList;

    if (startShops && startShops.length) {
      targetShops = [...targetShops, ...startShops];
    }

    const shops = await getShops(targetShops);

    if (shops === null) return reject(new MissingShopError("", task));

    const queue = new QueryQueue(
      concurrency ? concurrency : CONCURRENCY,
      proxyAuth,
      task
    );
    await queue.connect();

    const procProductsPromiseArr = [];

    async function isProcessComplete() {
      const check = await checkProgress({
        task,
        queue,
        infos,
        startTime,
        productLimit: _productLimit,
      });
      if (check instanceof TaskCompletedStatus) {
        const remaining = await countRemainingProductsShop(
          shopDomain,
          taskId,
          type
        );
        log(`Remaining products: ${remaining}`);
        clearInterval(interval);
        await updateMatchProgress(shopDomain, hasEan); // update match progress
        await updateProgressInLookupInfoTask(); // update lookup info task progress
        await updateProgressInLookupCategoryTask();
        handleResult(check, resolve, reject);
      }
    }
    const interval = setInterval(
      async () => await isProcessComplete(),
      DEFAULT_CHECK_PROGRESS_INTERVAL
    );

    const shuffled = shuffle(lockedProducts);

    const sliced = shuffled;

    const handleOutput = async (
      procProd: DbProductRecord,
      product: DbProductRecord
    ) => {
      const { e_qty, a_qty, _id: productId } = product;
      const { e_lnk, a_lnk, a_nm, e_nm, e_prc, a_prc } = procProd;
      let productUpdate: Partial<DbProductRecord> = {};

      await handleRelocateLinks(procProd, infos);

      const esin = parseEsinFromUrl(e_lnk);
      if (esin) {
        productUpdate["e_nm"] = replaceAllHiddenCharacters(e_nm!);
        productUpdate["e_qty"] = e_qty || 1;
        productUpdate["e_uprc"] = e_prc;
        productUpdate["e_lnk"] = e_lnk!.split("?")[0];
        productUpdate["esin"] = esin;
        productUpdate["eby_prop"] = "complete";
      }

      const asin = parseAsinFromUrl(a_lnk);
      if (asin) {
        productUpdate["a_nm"] = replaceAllHiddenCharacters(a_nm!);
        productUpdate["a_qty"] = a_qty || 1;
        productUpdate["a_uprc"] = a_prc;
        productUpdate["asin"] = asin;
        productUpdate["bsr"] = [];
      }
      productUpdate["matched"] = true;

      const result = await updateArbispotterProductQuery(
        shopDomain,
        productId,
        {
          $set: productUpdate,
          $unset: {
            taskId: "",
          },
        }
      );
      log(
        `Matched ${shopDomain}-${productId} Ebay: ${Boolean(
          esin
        )} Amazon: ${Boolean(asin)} `,
        result
      );
    };

    for (let index = 0; index < sliced.length; index++) {
      const product = sliced[index];

      const { nm, mnfctr } = product;
      const ean = getEanFromProduct(product);

      let reducedName = reduceString(nm, 55);

      if (mnfctr !== undefined) {
        reducedName = `${mnfctr} ${reducedName}`;
      }

      const query = {
        ...defaultQuery,
        product: {
          key: reducedName,
          value: ean || reducedName,
        },
        category: "default",
      };

      const prodInfo = {
        procProd: product,
        rawProd: product,
        dscrptnSegments: [],
        nmSubSegments: [],
      };

      const _shops = await queryTargetShops(
        startShops ? startShops : targetShops,
        queue,
        shops,
        query,
        task,
        prodInfo,
        srcShop,
        log
      );

      procProductsPromiseArr.push(
        Promise.all(_shops).then(async (targetShopProducts) => {
          infos.total++;
          queue.total++;
          if (targetShopProducts[0] && targetShopProducts[0]?.procProd) {
            const procProd = targetShopProducts[0]?.procProd;
            await handleOutput(procProd as DbProductRecord, product);
          } else if (targetShopProducts[0].path !== "wtf") {
            const { procProd, candidates } = matchTargetShopProdsWithRawProd(
              targetShopProducts,
              prodInfo
            );
            await handleOutput(procProd, product);
          }
          await isProcessComplete();
          return;
        })
      );
    }
    await Promise.all(procProductsPromiseArr);
  });
}
