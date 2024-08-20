import {
  QueryQueue,
  queryTargetShops,
  standardTargetRetailerList,
  reduceString,
  matchTargetShopProdsWithRawProd,
  replaceAllHiddenCharacters,
} from "@dipmaxtech/clr-pkg";
import { shuffle } from "underscore";
import { handleResult } from "../handleResult.js";
import { MissingProductsError, MissingShopError } from "../errors.js";
import { getShop, getShops } from "./db/util/shops.js";
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
import { lockProductsForMatch } from "./db/util/match/lockProductsForMatch.js";
import { handleRelocateLinks } from "../util/handleRelocateLinks.js";
import { parseEsinFromUrl } from "../util/parseEsin.js";
import { updateArbispotterProductQuery } from "./db/util/crudArbispotterProduct.js";

export default async function match(task) {
  return new Promise(async (resolve, reject) => {
    const { shopDomain, concurrency, productLimit, startShops, _id, action } =
      task;

    const srcShop = await getShop(shopDomain);

    if (!srcShop) return reject(new MissingShopError("", task));

    const { hasEan, ean } = srcShop;

    const lockedProducts = await lockProductsForMatch(
      _id,
      shopDomain,
      action,
      Boolean(hasEan || ean),
      productLimit
    );

    let infos = {
      new: 0,
      total: 0,
      old: 0,
      failedSave: 0,
      notFound: 0,
      locked: 0,
      missingProperties: {
        name: 0,
        price: 0,
        link: 0,
        image: 0,
      },
    };

    if (!lockedProducts.length)
      return reject(
        new MissingProductsError(`No products for ${shopDomain}`, task)
      );

    const _productLimit =
      lockedProducts.length < productLimit
        ? lockedProducts.length
        : productLimit;
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

    const interval = setInterval(
      async () =>
        await checkProgress({
          queue,
          infos,
          startTime,
          productLimit: _productLimit,
        }).catch(async (r) => {
          clearInterval(interval);
          await updateMatchProgress(shopDomain, hasEan); // update match progress
          await updateProgressInLookupInfoTask(); // update lookup info task progress
          await updateProgressInLookupCategoryTask();
          handleResult(r, resolve, reject);
        }),
      DEFAULT_CHECK_PROGRESS_INTERVAL
    );

    async function isProcessComplete() {
      if (infos.total === _productLimit && !queue.idle()) {
        await checkProgress({
          queue,
          infos,
          startTime,
          productLimit: _productLimit,
        }).catch(async (r) => {
          clearInterval(interval);
          await updateMatchProgress(shopDomain, hasEan); // update match progress
          await updateProgressInLookupInfoTask(); // update lookup info task progress
          await updateProgressInLookupCategoryTask();
          handleResult(r, resolve, reject);
        });
      }
    }

    const shuffled = shuffle(lockedProducts);

    const sliced = shuffled;

    const handleOutput = async (procProd, product) => {
      const { e_qty, a_qty, lnk: productLink } = product;
      const { e_lnk, a_lnk, a_nm, e_nm, e_prc, a_prc } = procProd;
      let productUpdate = {};

      await handleRelocateLinks(procProd, infos);

      const esin = parseEsinFromUrl(e_lnk);
      if (esin) {
        productUpdate["e_nm"] = replaceAllHiddenCharacters(e_nm);
        productUpdate["e_qty"] = e_qty || 1;
        productUpdate["e_uprc"] = e_prc;
        productUpdate["e_lnk"] = e_lnk.split("?")[0];
        productUpdate["esin"] = esin;
        productUpdate["eby_prop"] = "complete";
      }

      const asin = parseAsinFromUrl(a_lnk);
      if (asin) {
        productUpdate["a_nm"] = replaceAllHiddenCharacters(a_nm);
        productUpdate["a_qty"] = a_qty || 1;
        productUpdate["a_uprc"] = a_prc;
        productUpdate["asin"] = asin;
        productUpdate["bsr"] = [];
      }
      productUpdate["matched"] = true;

      await updateArbispotterProductQuery(shopDomain, productLink, {
        $set: productUpdate,
        $unset: {
          taskId: "",
        },
      });
    };

    for (let index = 0; index < sliced.length; index++) {
      const product = sliced[index];

      const { nm, ean, mnfctr } = product;

      const reducedName = mnfctr + " " + reduceString(nm, 55);

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
        srcShop
      );

      procProductsPromiseArr.push(
        Promise.all(_shops).then(async (targetShopProducts) => {
          infos.total++;
          queue.total++;
          console.log(
            "total products:",
            infos.total,
            "total queue:",
            _productLimit
          );
          if (targetShopProducts[0] && targetShopProducts[0]?.procProd) {
            const procProd = targetShopProducts[0]?.procProd;
            await handleOutput(procProd, product);
          } else {
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
