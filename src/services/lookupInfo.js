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
import { updateCrawledProduct } from "./db/util/crudCrawlDataProduct.js";
import { createOrUpdateProduct } from "./db/util/createOrUpdateProduct.js";
import { upsertAsin } from "./db/util/asinTable.js";
import { lookForUnmatchedEans } from "./db/util/lookForUnmatchedEans.js";
import { getShop } from "./db/util/shops.js";
import { updateProgressInLookupInfoTask } from "../util/updateProgressInTasks.js";
import { updateProduct } from "./db/util/crudArbispotterProduct.js";

export default async function lookupInfo(task) {
  return new Promise(async (resolve, reject) => {
    const { productLimit, _id, action, proxyType, type, browserConcurrency } =
      task;

    let infos = {
      new: 0,
      total: 0,
      old: 0,
      new: 0,
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

    shops.forEach((info) => {
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
      const { product, shop } = products[index];
      const shopDomain = shop.d;
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
      } = product;

      const _id = product._id;
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
        asin: "",
        mnfctr,
        nm: prodNm,
        img: prefixLink(img, s),
        lnk: prefixLink(lnk, s),
        prc: prmPrc ? safeParsePrice(prmPrc) : safeParsePrice(prc),
      };

      const addProduct = async (product) => {};
      const addProductInfo = async ({ productInfo, url }) => {
        const infoCb = (isNewProduct) => {
          if (isNewProduct) {
            infos.new++;
          } else {
            infos.old++;
          }
        };
        if (productInfo) {
          const processedProductUpdate = generateUpdate(productInfo, prc);
          await upsertAsin(processedProductUpdate.asin, [ean]);

          processedProductUpdate["aznUpdatedAt"] = new Date().toISOString();

          processedProductUpdate["eanList"] = [ean];
          processedProductUpdate["a_orgn"] = "a";
          processedProductUpdate["a_pblsh"] = true;

          const crawlDataProductUpdate = {
            info_locked: false,
            info_taskId: "",
            info_prop: "complete",
            asin: processedProductUpdate.asin,
          };
          const updatedProduct = { ...procProd, ...processedProductUpdate };
          await createOrUpdateProduct(shopDomain, updatedProduct, infoCb);
          await updateCrawledProduct(shopDomain, lnk, crawlDataProductUpdate);
        } else {
          infos.missingProperties[shopDomain].hashes.push(_id.toString());
          const properties = ["ean", "image"];
          properties.forEach((prop) => {
            if (!product[prop]) {
              infos.missingProperties[shopDomain][prop]++;
            }
          });
          await updateProduct(shopDomain, lnk, {
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
          const update = {
            info_locked: false,
            info_prop: "missing",
            info_taskId: "",
          };
          await updateCrawledProduct(shopDomain, lnk, update);
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
        await updateProduct(shopDomain, lnk, {
          asin: "",
          info_prop: "missing",
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
        const update = {
          info_locked: false,
          info_prop: "missing",
          info_taskId: "",
        };
        await updateCrawledProduct(shopDomain, lnk, update);
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
        addProduct,
        onNotFound: handleNotFound,
        addProductInfo,
        queue,
        query: {
          product: {
            value: ean,
            key: ean,
          },
        },
        prio: 0,
        extendedLookUp: false,
        limit: undefined,
        prodInfo: undefined,
        isFinished: undefined,
        pageInfo: {
          link: toolInfo.entryPoints[0].url,
          name: toolInfo.d,
        },
      });
    }
  });
}
