import {
  QueryQueue,
  getManufacturer,
  getPrice,
  segmentString,
  prefixLink,
  queryTargetShops,
  matchTargetShopProdsWithRawProd,
  standardTargetRetailerList,
  reduceString,
} from "@dipmaxtech/clr-pkg";
import _ from "underscore";
import parsePrice from "parse-price";
import { createArbispotterCollection } from "./db/mongo.js";
import { handleResult } from "../handleResult.js";
import { MissingProductsError, MissingShopError } from "../errors.js";
import { createOrUpdateProduct } from "./db/util/findAndUpdateProduct.js";
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

    let done = 0;

    if (!rawproducts.length)
      return reject(
        new MissingProductsError(`No products for ${shopDomain}`, task)
      );

    const startTime = Date.now();

    let targetShops = standardTargetRetailerList

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
        await checkProgress({ queue, done, startTime, productLimit }).catch(
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
        price: prc,
        promoPrice: prmPrc,
        image: img,
        link: lnk,
        shop: s,
      } = rawProd;

      const { mnfctr, prodNm } = getManufacturer(name);
      const dscrptnSegments = segmentString(description);
      const nmSubSegments = segmentString(nameSub);

      let procProd = {
        ctgry,
        mnfctr,
        nm: prodNm,
        img: prefixLink(img, s),
        lnk: prefixLink(lnk, s),
        prc: prmPrc
          ? parsePrice(getPrice(prmPrc ? prmPrc.replace(/\s+/g, "") : ""))
          : parsePrice(getPrice(prc ? prc.replace(/\s+/g, "") : "")),
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
        Promise.all(_shops).then(async (targetShopProds) => {
          if (done >= productLimit && !queue.idle()) {
            await checkProgress({ queue, done, startTime, productLimit }).catch(
              async (r) => {
                clearInterval(interval);
                handleResult(r, resolve, reject);
              }
            );
          }
          done++;
          if (targetShopProds[0] && targetShopProds[0]?.procProd) {
            const procProd = targetShopProds[0]?.procProd;
            await createOrUpdateProduct(collectionName, procProd);
            const update = {
              dscrptnSegments,
              nmSubSegments,
              query: query.product.value,
              mnfctr,
              matched: true,
              locked: false,
              taskId: "",
              updatedAt: new Date().toISOString(),
              matchedAt: new Date().toISOString(),
            };
            if (targetShopProds[0]?.candidates) {
              update.candidates = targetShopProds[0]?.candidates;
            }
            await updateCrawledProduct(
              shopDomain,
              rawProd.link,
              update
            );
            return procProd;
          } else {
            const { procProd, candidates } = matchTargetShopProdsWithRawProd(
              targetShopProds,
              prodInfo
            );
            await createOrUpdateProduct(collectionName, procProd);
            await updateCrawledProduct(shopDomain, rawProd.link, {
              matched: true,
              locked: false,
              taskId: "",
              query: query.product.value,
              dscrptnSegments,
              nmSubSegments,
              updatedAt: new Date().toISOString(),
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
