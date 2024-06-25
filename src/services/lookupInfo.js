import {
  QueryQueue,
  generateUpdate,
  getManufacturer,
  prefixLink,
  querySellerInfosQueue,
  safeParsePrice,
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
import { updateProgressInMatchTasks } from "../util/updateProgressInMatchTasks.js";
import { createOrUpdateProduct } from "./db/util/createOrUpdateProduct.js";
import { upsertAsin } from "./db/util/asinTable.js";
import { lookForUnmatchedEans } from "./db/util/lookForUnmatchedEans.js";
import { getShop } from "./db/util/shops.js";
import {
  updateLookupInfoProgress,
  updateProgressInLookupInfoTask,
} from "../util/updateProgressInTasks.js";

export default async function lookupInfo(task) {
  return new Promise(async (resolve, reject) => {
    const { productLimit, _id, action, proxyType, type } = task;

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

    const queue = new QueryQueue(
      task?.concurrency ? task.concurrency : CONCURRENCY,
      proxyAuth,
      task
    );
    await queue.connect();

    const interval = setInterval(
      async () =>
        await checkProgress({
          queue,
          infos,
          startTime,
          productLimit: _productLimit,
        }).catch(async (r) => {
          clearInterval(interval);
          await updateProgressInLookupInfoTask();
          handleResult(r, resolve, reject);
        }),
      DEFAULT_CHECK_PROGRESS_INTERVAL
    );

    for (let index = 0; index < products.length; index++) {
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

          processedProductUpdate["info_prop"] = "complete";
          processedProductUpdate["aznUpdatedAt"] = new Date().toISOString();

          processedProductUpdate["eanList"] = [ean];

          const crawlDataProductUpdate = {
            info_looked: false,
            info_taskId: "",
            asin: processedProductUpdate.asin,
          };
          await createOrUpdateProduct(
            shopDomain,
            { ...procProd, ...processedProductUpdate },
            infoCb
          );
          await updateCrawledProduct(shopDomain, lnk, crawlDataProductUpdate);
        } else {
          infos.missingProperties[shopDomain].hashes.push(_id.toString());
          const properties = ["ean", "image"];
          properties.forEach((prop) => {
            if (!product[prop]) {
              infos.missingProperties[shopDomain][prop]++;
            }
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
            queue,
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
        console.log('not found: about to update crawled product')
        const update = {
          info_locked: false,
          info_prop: "missing",
          info_taskId: "",
        };
        await updateCrawledProduct(shopDomain, lnk, update);
        if (infos.total >= _productLimit - 1 && !queue.idle()) {
          await checkProgress({
            queue,
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
