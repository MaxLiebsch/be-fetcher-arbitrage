import {
  QueryQueue,
  getManufacturer,
  segmentString,
  prefixLink,
  queryTargetShops,
  standardTargetRetailerList,
  reduceString,
  safeParsePrice,
} from "@dipmaxtech/clr-pkg";
import _ from "underscore";
import { createArbispotterCollection } from "./db/mongo.js";
import { handleResult } from "../handleResult.js";
import { MissingProductsError, MissingShopError } from "../errors.js";
import { createOrUpdateProduct } from "./db/util/createOrUpdateProduct.js";
import { getShops } from "./db/util/shops.js";
import {
  lockProducts,
  updateCrawledProduct,
} from "./db/util/crudCrawlDataProduct.js";
import {
  CONCURRENCY,
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  proxyAuth,
} from "../constants.js";
import { checkProgress } from "../util/checkProgress.js";
import { getRedirectUrl } from "./head.js";
import { AxiosError } from "axios";

export default async function match(task) {
  return new Promise(async (resolve, reject) => {
    const { shopDomain, productLimit, startShops, test } = task;
    const collectionName = test ? `test.${shopDomain}` : shopDomain;
    await createArbispotterCollection(collectionName);

    const rawproducts = await lockProducts(
      shopDomain,
      productLimit,
      task._id,
      task?.action
    );

    let infos = {
      new: 0,
      total: 0,
      old: 0,
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

    infos.locked = rawproducts.length;

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
        await checkProgress({ queue, infos, startTime, productLimit }).catch(
          async (r) => {
            clearInterval(interval);
            handleResult(r, resolve, reject);
          }
        ),
      DEFAULT_CHECK_PROGRESS_INTERVAL
    );

    const shuffled = _.shuffle(rawproducts);

    const sliced = shuffled;

    for (let index = 0; index < sliced.length; index++) {
      const rawProd = sliced[index];

      const {
        name,
        description,
        category: ctgry,
        nameSub,
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
          value: reducedName,
        },
        category: "default",
      };
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
        prodInfo
      );

      procProductsPromiseArr.push(
        Promise.all(_shops).then(async (targetShopProducts) => {
          const infoCb = (isNewProduct) => {
            if (isNewProduct) {
              infos.new++;
            } else {
              infos.old++;
            }
          };

          if (infos.total >= productLimit - 1 && !queue.idle()) {
            await checkProgress({
              queue,
              infos,
              startTime,
              productLimit,
            }).catch(async (r) => {
              clearInterval(interval);
              handleResult(r, resolve, reject);
            });
          }
          infos.total++;
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
            await createOrUpdateProduct(collectionName, procProd, infoCb);
            const update = {
              dscrptnSegments,
              nmSubSegments,
              path,
              query: query.product.value,
              mnfctr,
              matched: true,
              locked: false,
              taskId: "",
              matchedAt: new Date().toISOString(),
            };
            if (targetShopProducts[0]?.candidates) {
              update.candidates = targetShopProducts[0]?.candidates;
            }
            await updateCrawledProduct(shopDomain, rawProd.link, update);
            return procProd;
          }
        })
      );
    }
    await Promise.all(procProductsPromiseArr);
  });
}
