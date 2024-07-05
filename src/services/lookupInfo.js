import {
  QueryQueue,
  generateUpdate,
  getManufacturer,
  prefixLink,
  querySellerInfosQueue,
  safeParsePrice,
  yieldQueues,
} from "@dipmaxtech/clr-pkg";
import _ from "underscore";

import { handleResult } from "../handleResult.js";
import { MissingProductsError } from "../errors.js";
import {
  CONCURRENCY,
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  proxyAuth,
} from "../constants.js";
import { checkProgress } from "../util/checkProgress.js";
import { updateCrawlDataProduct } from "./db/util/crudCrawlDataProduct.js";
import { upsertAsin } from "./db/util/asinTable.js";
import { lookForUnmatchedEans } from "./db/util/lookupInfo/lookForUnmatchedEans.js";
import { getShop } from "./db/util/shops.js";
import { updateProgressInLookupInfoTask } from "../util/updateProgressInTasks.js";
import { updateArbispotterProduct } from "./db/util/crudArbispotterProduct.js";
import { createOrUpdateArbispotterProduct } from "./db/util/createOrUpdateArbispotterProduct.js";
import { createArbispotterCollection } from "./db/mongo.js";

export default async function lookupInfo(task) {
  return new Promise(async (resolve, reject) => {
    const { productLimit, _id, action, proxyType, type, browserConcurrency } =
      task;

    let infos = {
      new: 0,
      total: 0,
      old: 0,
      new: 0,
      failedSave: 0,
      notFound: 0,
      locked: 0,
      shops: {},
      missingProperties: {},
    };

    const { products, shops } = await lookForUnmatchedEans(
      _id,
      proxyType,
      action,
      productLimit
    );

    shops.forEach(async (info) => {
      await createArbispotterCollection(info.shop.d);
      infos.shops[info.shop.d] = 0;
      infos.missingProperties[info.shop.d] = {
        ean: 0,
        image: 0,
        hashes: [],
      };
    });

    if (!products.length)
      return reject(new MissingProductsError(`No products ${type}`, task));

    const _productLimit =
      products.length < productLimit ? products.length : productLimit;

    const toolInfo = await getShop("sellercentral.amazon.de");

    infos.locked = products.length;

    //Update task progress
    await updateProgressInLookupInfoTask();

    const startTime = Date.now();

    const queues = [];

    await Promise.all(
      Array.from({ length: browserConcurrency ?? 1 }, (v, k) => k + 1).map(
        async () => {
          const queue = new QueryQueue(
            task?.concurrency ? task.concurrency : CONCURRENCY,
            proxyAuth,
            task
          );
          queues.push(queue);
          return queue.connect();
        }
      )
    );

    const queueIterator = yieldQueues(queues);

    const interval = setInterval(async () => {
      const isDone = queues.every((q) => q.workload() === 0);
      if (isDone) {
        await checkProgress({
          queue: queues,
          infos,
          startTime,
          productLimit: _productLimit,
        }).catch(async (r) => {
          clearInterval(interval);
          await updateProgressInLookupInfoTask();
          handleResult(r, resolve, reject);
        });
      }
    }, DEFAULT_CHECK_PROGRESS_INTERVAL);

    for (let index = 0; index < products.length; index++) {
      const queue = queueIterator.next().value;
      const { product: crawlDataProduct, shop } = products[index];
      const shopDomain = shop.d;
      const hasEan = shop.hasEan || shop?.ean;
      const {
        name,
        category: ctgry,
        ean,
        asin,
        hasMnfctr,
        mnfctr: manufacturer,
        price: prc,
        promoPrice: prmPrc,
        image: img,
        link: crawlDataProductLink,
        shop: s,
      } = crawlDataProduct;

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

      let procProd = {
        ctgry,
        mnfctr,
        nm: prodNm,
        img: prefixLink(img, s),
        lnk: prefixLink(crawlDataProductLink, s),
        prc: prmPrc ? safeParsePrice(prmPrc) : safeParsePrice(prc),
      };

      const addProduct = async (product) => {};
      const addProductInfo = async ({ productInfo, url }) => {
        if (productInfo) {
          const processedProductUpdate = generateUpdate(productInfo, prc);
          
          if (hasEan && ean) {
            await upsertAsin(processedProductUpdate.asin, [ean]);
            processedProductUpdate["eanList"] = [ean];
          }

          processedProductUpdate["a_orgn"] = "a";
          processedProductUpdate["a_pblsh"] = true;

          const crawlDataProductUpdate = {
            info_locked: false,
            info_taskId: "",
            info_prop: "complete",
            aznUpdatedAt: new Date().toISOString(),
            costs: processedProductUpdate.costs,
            asin: processedProductUpdate.asin,
          };
          const updatedProduct = { ...procProd, ...processedProductUpdate };
          const result = await createOrUpdateArbispotterProduct(
            shopDomain,
            updatedProduct
          );
          if (result.acknowledged) {
            if (result.upsertedId) infos.new++;
            else infos.old++;
          } else {
            infos.failedSave++;
          }
          await updateCrawlDataProduct(
            shopDomain,
            crawlDataProductLink,
            crawlDataProductUpdate
          );
        } else {
          infos.missingProperties[shopDomain].hashes.push(
            crawlDataProduct.s_hash
          );
          await updateArbispotterProduct(shopDomain, crawlDataProductLink, {
            asin: "",
            a_pblsh: false,
            a_prc: 0,
            a_lnk: "",
            a_img: "",
            a_mrgn: 0,
            a_mrgn_pct: 0,
            a_w_mrgn: 0,
            a_w_mrgn_pct: 0,
            a_w_p_mrgn: 0,
            a_w_p_mrgn_pct: 0,
            a_p_mrgn: 0,
            a_p_mrgn_pct: 0,
            a_nm: "",
          });
          await updateCrawlDataProduct(shopDomain, crawlDataProductLink, {
            info_locked: false,
            info_prop: "missing",
            info_taskId: "",
          });
        }
        if (infos.total >= _productLimit - 1 && !queue.idle()) {
          await checkProgress({
            queue: queues,
            infos,
            startTime,
            productLimit: _productLimit,
          }).catch(async (r) => {
            clearInterval(interval);
            await updateProgressInLookupInfoTask();
            handleResult(r, resolve, reject);
          });
        }
        infos.shops[shopDomain]++;
        infos.total++;
      };
      const handleNotFound = async () => {
        infos.notFound++;
        const crawlDataProductUpdate = {
          info_locked: false,
          info_prop: "missing",
          info_taskId: "",
        };
        await updateArbispotterProduct(shopDomain, crawlDataProductLink, {
          asin: "",
          a_prc: 0,
          a_lnk: "",
          a_img: "",
          a_mrgn: 0,
          a_mrgn_pct: 0,
          a_w_mrgn: 0,
          a_w_mrgn_pct: 0,
          a_w_p_mrgn: 0,
          a_w_p_mrgn_pct: 0,
          a_p_mrgn: 0,
          a_p_mrgn_pct: 0,
          a_nm: "",
        });
        await updateCrawlDataProduct(
          shopDomain,
          crawlDataProductLink,
          crawlDataProductUpdate
        );
        if (infos.total >= _productLimit - 1 && !queue.idle()) {
          await checkProgress({
            queue: queues,
            infos,
            startTime,
            productLimit: _productLimit,
          }).catch(async (r) => {
            clearInterval(interval);
            await updateProgressInLookupInfoTask();
            handleResult(r, resolve, reject);
          });
        }
        infos.shops[shopDomain]++;
        infos.total++;
      };
      queue.pushTask(querySellerInfosQueue, {
        retries: 0,
        shop: toolInfo,
        targetShop: {
          prefix: "",
          d: shopDomain,
          name: shopDomain,
        },
        addProduct,
        onNotFound: handleNotFound,
        addProductInfo,
        queue,
        query: {
          product: {
            value: hasEan ? ean : asin,
            key: hasEan ? ean : asin,
          },
        },
        prio: 0,
        extendedLookUp: false,
        pageInfo: {
          link: toolInfo.entryPoints[0].url,
          name: toolInfo.d,
        },
      });
    }
  });
}
