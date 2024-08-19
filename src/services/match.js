import {
  QueryQueue,
  getManufacturer,
  segmentString,
  prefixLink,
  queryTargetShops,
  standardTargetRetailerList,
  reduceString,
  matchTargetShopProdsWithRawProd,
  replaceAllHiddenCharacters,
  roundToTwoDecimals,
} from "@dipmaxtech/clr-pkg";
import { shuffle } from "underscore";
import { createArbispotterCollection } from "./db/mongo.js";
import { handleResult } from "../handleResult.js";
import { MissingProductsError, MissingShopError } from "../errors.js";
import { getShop, getShops } from "./db/util/shops.js";
import { updateCrawlDataProduct } from "./db/util/crudCrawlDataProduct.js";
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
import { createOrUpdateArbispotterProduct } from "./db/util/createOrUpdateArbispotterProduct.js";
import { handleRelocateLinks } from "../util/handleRelocateLinks.js";
import { parseEsinFromUrl } from "../util/parseEsin.js";

export default async function match(task) {
  return new Promise(async (resolve, reject) => {
    const { shopDomain, productLimit, startShops, test, _id, action } = task;
    const collectionName = test ? `test.${shopDomain}` : shopDomain;
    await createArbispotterCollection(collectionName);

    const srcShop = await getShop(shopDomain);

    if (!srcShop) return reject(new MissingShopError("", task));

    const lockedProducts = await lockProductsForMatch(
      _id,
      shopDomain,
      action,
      srcShop.hasEan || srcShop?.ean,
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
    await updateMatchProgress(shopDomain, srcShop.hasEan);

    const startTime = Date.now();

    let targetShops = standardTargetRetailerList;

    if (startShops && startShops.length) {
      targetShops = [...targetShops, ...startShops];
    }

    const shops = await getShops(targetShops);

    if (shops === null) return reject(new MissingShopError("", task));

    const queue = new QueryQueue(
      task?.concurrency ? task.concurrency : CONCURRENCY,
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
          await updateMatchProgress(shopDomain, srcShop.hasEan); // update match progress
          await updateProgressInLookupInfoTask(); // update lookup info task progress
          await updateProgressInLookupCategoryTask();
          handleResult(r, resolve, reject);
        }),
      DEFAULT_CHECK_PROGRESS_INTERVAL
    );

    const shuffled = shuffle(lockedProducts);

    const sliced = shuffled;

    for (let index = 0; index < sliced.length; index++) {
      const rawProd = sliced[index];

      const {
        name,
        description,
        category: ctgry,
        nameSub,
        ean,
        hasMnfctr,
        mnfctr: manufacturer,
        price,
        e_qty,
        a_qty,
        promoPrice,
        uprc: unitPrice,
        qty,
        image: img,
        link: lnk,
        shop: s,
      } = rawProd;

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
      const dscrptnSegments = segmentString(description);
      const nmSubSegments = segmentString(nameSub);

      let procProd = {
        ctgry,
        asin: "",
        mnfctr,
        nm: prodNm,
        img: prefixLink(img, s),
        lnk: prefixLink(lnk, s),
        prc: promoPrice ? promoPrice : price,
        uprc: unitPrice,
        qty,
      };

      const reducedName = mnfctr + " " + reduceString(prodNm, 55);

      const query = {
        ...defaultQuery,
        product: {
          key: reducedName,
          value: ean || reducedName,
        },
        category: "default",
      };

      if (ean) {
        procProd["eanList"] = [ean];
      }

      const prodInfo = {
        procProd,
        rawProd,
        dscrptnSegments,
        nmSubSegments,
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
          if (infos.total === _productLimit && !queue.idle()) {
            await checkProgress({
              queue,
              infos,
              startTime,
              productLimit: _productLimit,
            }).catch(async (r) => {
              clearInterval(interval);
              await updateMatchProgress(shopDomain, srcShop.hasEan); // update match progress
              await updateProgressInLookupInfoTask(); // update lookup info task progress
              await updateProgressInLookupCategoryTask();
              handleResult(r, resolve, reject);
            });
          }
          if (targetShopProducts[0] && targetShopProducts[0]?.procProd) {
            const procProd = targetShopProducts[0]?.procProd;
            const path = targetShopProducts[0].path;
            const crawlDataProductUpdate = {
              taskId: "",
              dscrptnSegments,
              matched: true,
              locked: false,
              nmSubSegments,
              path,
              query: query.product.value,
              mnfctr,
              matchedAt: new Date().toISOString(),
            };

            await handleRelocateLinks(procProd, infos);

            const esin = parseEsinFromUrl(procProd.e_lnk);
            if (esin) {
              procProd["e_nm"] = replaceAllHiddenCharacters(procProd.e_nm);
              procProd["e_qty"] = e_qty || 1;
              procProd["e_uprc"] = procProd.e_prc;

              procProd["e_lnk"] = procProd.e_lnk.split("?")[0];
              procProd["esin"] = esin;
              crawlDataProductUpdate["e_qty"] = procProd["e_qty"];
              crawlDataProductUpdate["eby_prop"] = "complete";
              crawlDataProductUpdate["esin"] = esin;
            }

            const asin = parseAsinFromUrl(procProd.a_lnk);
            if (asin) {
              procProd["a_nm"] = replaceAllHiddenCharacters(procProd.a_nm);
              procProd["a_qty"] = a_qty || 1;
              procProd["a_uprc"] = procProd.a_prc;
              procProd["asin"] = asin;
              crawlDataProductUpdate["asin"] = asin;
            }

            procProd["bsr"] = [];

            const result = await createOrUpdateArbispotterProduct(
              collectionName,
              procProd
            );
            if (result.acknowledged) {
              if (result.upsertedId) infos.new++;
              else infos.old++;
            } else {
              infos.failedSave++;
            }
            if (targetShopProducts[0]?.candidates) {
              crawlDataProductUpdate.candidates =
                targetShopProducts[0]?.candidates;
            }
            await updateCrawlDataProduct(
              shopDomain,
              rawProd.link,
              crawlDataProductUpdate
            );
            return procProd;
          } else {
            const path = targetShopProducts[0].path;
            const { procProd, candidates } = matchTargetShopProdsWithRawProd(
              targetShopProducts,
              prodInfo
            );
            const crawlDataProductUpdate = {
              dscrptnSegments,
              nmSubSegments,
              asin: procProd.asin,
              path,
              bsr: [],
              query: query.product.value,
              mnfctr,
              matchedAt: new Date().toISOString(),
              taskId: "",
              matched: true,
              locked: false,
              candidates,
            };
            await handleRelocateLinks(procProd, infos);

            const esin = parseEsinFromUrl(procProd.e_lnk);
            if (esin) {
              procProd["e_nm"] = replaceAllHiddenCharacters(procProd.e_nm);
              procProd["e_qty"] = 1;
              procProd["e_uprc"] = roundToTwoDecimals(procProd.e_prc / e_qty);
              procProd["e_lnk"] = procProd.e_lnk.split("?")[0];
              procProd["esin"] = esin;
              crawlDataProductUpdate["eby_prop"] = "complete";
              crawlDataProductUpdate["esin"] = esin;
            }

            const asin = parseAsinFromUrl(procProd.a_lnk);
            if (asin) {
              procProd["a_nm"] = replaceAllHiddenCharacters(procProd.a_nm);
              procProd["a_qty"] = a_qty || 1;
              procProd["a_uprc"] = roundToTwoDecimals(procProd.a_prc / a_qty);
              procProd.asin = asin;
              crawlDataProductUpdate["asin"] = asin;
            }

            const result = await createOrUpdateArbispotterProduct(
              collectionName,
              procProd
            );
            if (result.acknowledged) {
              if (result.upsertedId) infos.new++;
              else infos.old++;
            } else {
              infos.failedSave++;
            }
            await updateCrawlDataProduct(
              shopDomain,
              rawProd.link,
              crawlDataProductUpdate
            );
            return procProd;
          }
        })
      );
    }
    await Promise.all(procProductsPromiseArr);
  });
}
