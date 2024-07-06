import {
  QueryQueue,
  getManufacturer,
  segmentString,
  prefixLink,
  queryTargetShops,
  standardTargetRetailerList,
  reduceString,
  safeParsePrice,
  matchTargetShopProdsWithRawProd,
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
  proxyAuth,
} from "../constants.js";
import { checkProgress } from "../util/checkProgress.js";
import { parseAsinFromUrl } from "../util/parseAsin.js";
import {
  updateCrawlAznListingsProgress,
  updateCrawlEbyListingsProgress,
  updateMatchProgress,
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
      lockedProducts.length < productLimit ? lockedProducts.length : productLimit;

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
          await updateCrawlAznListingsProgress(shopDomain); // update crawl azn listings progress
          await updateCrawlEbyListingsProgress(shopDomain); // update crawl eby listings progress
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
        price: prc,
        promoPrice: prmPrc,
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
        prc: prmPrc ? safeParsePrice(prmPrc) : safeParsePrice(prc),
      };

      const reducedName = mnfctr + " " + reduceString(prodNm, 55);

      const query = {
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
          if (infos.total >= _productLimit - 1 && !queue.idle()) {
            await checkProgress({
              queue,
              infos,
              startTime,
              productLimit: _productLimit,
            }).catch(async (r) => {
              clearInterval(interval);
              await updateMatchProgress(shopDomain, srcShop.hasEan); // update match progress
              await updateCrawlAznListingsProgress(shopDomain); // update crawl azn listings progress
              await updateCrawlEbyListingsProgress(shopDomain); // update crawl eby listings progress
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
              procProd["esin"] = esin;
              crawlDataProductUpdate["eby_prop"] = "complete";
              crawlDataProductUpdate["esin"] = esin;
            }

            const asin = parseAsinFromUrl(procProd.a_lnk);
            if (asin) {
              procProd.asin = asin;
              crawlDataProductUpdate["asin"] = asin;
            }
            
            procProd['bsr'] = [];

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
              crawlDataProductUpdate["eby_prop"] = "complete";
              crawlDataProductUpdate["esin"] = esin;
              procProd["esin"] = esin;
            }

            const asin = parseAsinFromUrl(procProd.a_lnk);
            if (asin) {
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
