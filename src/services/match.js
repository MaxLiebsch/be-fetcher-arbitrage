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
import { updateCrawledProduct } from "./db/util/crudCrawlDataProduct.js";
import {
  CONCURRENCY,
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  proxyAuth,
} from "../constants.js";
import { checkProgress } from "../util/checkProgress.js";
import { getRedirectUrl } from "./head.js";
import { AxiosError } from "axios";
import { parseAsinFromUrl } from "../util/parseAsin.js";
import {
  updateCrawlAznListingsProgress,
  updateMatchProgress,
} from "../util/updateProgressInTasks.js";
import { lockProductsForMatch } from "./db/util/lockProductsForMatch.js";
import { createOrUpdateArbispotterProduct } from "./db/util/createOrUpdateArbispotterProduct.js";

export default async function match(task) {
  return new Promise(async (resolve, reject) => {
    const { shopDomain, productLimit, startShops, test, _id, action } = task;
    const collectionName = test ? `test.${shopDomain}` : shopDomain;
    await createArbispotterCollection(collectionName);

    const srcShop = await getShop(shopDomain);

    if (!srcShop) return reject(new MissingShopError("", task));

    const rawproducts = await lockProductsForMatch(
      shopDomain,
      productLimit,
      _id,
      action,
      srcShop.hasEan || srcShop?.ean
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

    if (!rawproducts.length)
      return reject(
        new MissingProductsError(`No products for ${shopDomain}`, task)
      );

    const _productLimit =
      rawproducts.length < productLimit ? rawproducts.length : productLimit;

    infos.locked = rawproducts.length;

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
          handleResult(r, resolve, reject);
        }),
      DEFAULT_CHECK_PROGRESS_INTERVAL
    );

    const shuffled = shuffle(rawproducts);

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
              handleResult(r, resolve, reject);
            });
          }
          if (targetShopProducts[0] && targetShopProducts[0]?.procProd) {
            const path = targetShopProducts[0].path;
            const procProd = targetShopProducts[0]?.procProd;
            try {
              if (
                procProd.a_lnk &&
                procProd.a_lnk.includes("idealo.de/relocator/relocate")
              ) {
                const redirectUrl = await getRedirectUrl(procProd.a_lnk);
                procProd.a_lnk = redirectUrl;
              }
              if (
                procProd.e_lnk &&
                procProd.e_lnk.includes("idealo.de/relocator/relocate")
              ) {
                const redirectUrl = await getRedirectUrl(procProd.e_lnk);
                procProd.e_lnk = redirectUrl;
              }
            } catch (error) {
              if (error instanceof AxiosError) {
                if (error.response?.status === 404) {
                  infos.notFound++;
                }
              }
            }
            const asin = parseAsinFromUrl(procProd.a_lnk);
            if (asin) {
              procProd.asin = asin;
            }
            if (procProd.a_prc) {
              procProd["aznUpdatedAt"] = new Date().toISOString();
            }
            //Publish the product if it has a price && margin
            if (procProd.e_prc && procProd.e_mrgn) {
              procProd["e_pblsh"] = true;
            }
            if (procProd.a_prc && procProd.a_mrgn) {
              procProd["a_pblsh"] = true;
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
            const crawlDataProductUpdate = {
              dscrptnSegments,
              nmSubSegments,
              asin: procProd.asin,
              path,
              query: query.product.value,
              mnfctr,
              matched: true,
              locked: false,
              matchedAt: new Date().toISOString(),
              taskId: "",
            };
            if (targetShopProducts[0]?.candidates) {
              crawlDataProductUpdate.candidates =
                targetShopProducts[0]?.candidates;
            }
            await updateCrawledProduct(
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
            try {
              if (
                procProd.a_lnk &&
                procProd.a_lnk.includes("idealo.de/relocator/relocate")
              ) {
                const redirectUrl = await getRedirectUrl(procProd.a_lnk);
                procProd.a_lnk = redirectUrl;
              }
              if (
                procProd.e_lnk &&
                procProd.e_lnk.includes("idealo.de/relocator/relocate")
              ) {
                const redirectUrl = await getRedirectUrl(procProd.e_lnk);
                procProd.e_lnk = redirectUrl;
              }
            } catch (error) {
              if (error instanceof AxiosError) {
                if (error.response?.status === 404) {
                  infos.notFound++;
                }
              }
            }
            const asin = parseAsinFromUrl(procProd.a_lnk);
            if (asin) {
              procProd.asin = asin;
            }
            if (procProd.a_prc) {
              procProd["aznUpdatedAt"] = new Date().toISOString();
            }
            //Publish the product if it has a price
            if (procProd.e_prc && procProd.e_mrgn) {
              procProd["e_pblsh"] = true;
            }
            if (procProd.a_prc && procProd.a_mrgn) {
              procProd["a_pblsh"] = true;
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
            await updateCrawledProduct(shopDomain, rawProd.link, {
              matched: true,
              locked: false,
              asin: procProd.asin,
              price: procProd.prc,
              taskId: "",
              query: query.product.value,
              dscrptnSegments,
              nmSubSegments,
              matchedAt: new Date().toISOString(),
              mnfctr,
              candidates,
            });
            return procProd;
          }
        })
      );
    }
    await Promise.all(procProductsPromiseArr);
  });
}
