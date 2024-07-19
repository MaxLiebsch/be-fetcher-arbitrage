import {
  QueryQueue,
  detectQuantity,
  getManufacturer,
  prefixLink,
  queryEansOnEbyQueue,
  queryURLBuilder,
  replaceAllHiddenCharacters,
  roundToTwoDecimals,
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
import { updateCrawlDataProduct } from "./db/util/crudCrawlDataProduct.js";
import {
  updateProgressInLookupCategoryTask,
  updateProgressInQueryEansOnEbyTask,
} from "../util/updateProgressInTasks.js";
import { lookForUnmatchedQueryEansOnEby } from "./db/util/queryEansOnEby/lookForUnmatchedEansOnEby.js";
import { createHash } from "../util/hash.js";
import { getShop } from "./db/util/shops.js";
import { createArbispotterCollection } from "./db/mongo.js";
import { createOrUpdateArbispotterProduct } from "./db/util/createOrUpdateArbispotterProduct.js";

export default async function queryEansOnEby(task) {
  return new Promise(async (resolve, reject) => {
    const { productLimit, _id, action, proxyType, type } = task;

    let infos = {
      new: 0,
      total: 0,
      old: 0,
      notFound: 0,
      locked: 0,
      shops: {},
      missingProperties: {},
    };

    const { products: rawProducts, shops } =
      await lookForUnmatchedQueryEansOnEby(
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

    if (!rawProducts.length)
      return reject(new MissingProductsError(`No products ${type}`, task));

    const _productLimit =
      rawProducts.length < productLimit ? rawProducts.length : productLimit;

    infos.locked = rawProducts.length;

    //Update task progress
    await updateProgressInQueryEansOnEbyTask();

    const startTime = Date.now();

    const queue = new QueryQueue(
      task?.concurrency ? task.concurrency : CONCURRENCY,
      proxyAuth,
      task
    );
    await queue.connect();

    await updateProgressInQueryEansOnEbyTask(); // update query eans on eby task

    const toolInfo = await getShop("ebay.de");

    const interval = setInterval(
      async () =>
        await checkProgress({
          queue,
          infos,
          startTime,
          productLimit: _productLimit,
        }).catch(async (r) => {
          clearInterval(interval);
          await updateProgressInQueryEansOnEbyTask(); // update query eans on eby task
          await updateProgressInLookupCategoryTask(); // update lookup category task
          handleResult(r, resolve, reject);
        }),
      DEFAULT_CHECK_PROGRESS_INTERVAL
    );

    for (let index = 0; index < rawProducts.length; index++) {
      const { shop: srcShop, product: rawCrawlDataProduct } =
        rawProducts[index];
      const srcShopDomain = srcShop.d;
      const {
        name,
        category: ctgry,
        ean,
        hasMnfctr,
        mnfctr: manufacturer,
        price: prc,
        promoPrice: prmPrc,
        qty,
        uprc,
        image: img,
        link,
        shop: s,
      } = rawCrawlDataProduct;

      const query = {
        product: {
          value: ean,
          key: ean,
        },
        category: "default",
      };

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
        lnk: prefixLink(link, s),
        s_hash: rawCrawlDataProduct.s_hash,
        prc: prmPrc ? safeParsePrice(prmPrc) : safeParsePrice(prc),
        uprc,
        qty,
      };

      const foundProducts = [];

      const addProduct = async (product) => {
        foundProducts.push(product);
      };
      const isFinished = async () => {
        const arbispotterProductUpdate = {};
        if (infos.total >= _productLimit - 1 && !queue.idle()) {
          await checkProgress({
            queue,
            infos,
            startTime,
            productLimit: _productLimit,
          }).catch(async (r) => {
            clearInterval(interval);
            await updateProgressInQueryEansOnEbyTask(); // update query eans on eby task
            await updateProgressInLookupCategoryTask(); // update lookup category task
            handleResult(r, resolve, reject);
          });
        }
        const foundProduct = foundProducts.find((p) => p.link && p.price);
        if (foundProduct) {
          arbispotterProductUpdate["e_img"] = foundProduct.image;
          const shortLink = foundProduct.link.split("?")[0];
          arbispotterProductUpdate["e_lnk"] = shortLink;
          arbispotterProductUpdate["e_hash"] = createHash(shortLink);
          arbispotterProductUpdate["eanList"] = [ean];
          arbispotterProductUpdate["e_orgn"] = "e";
          arbispotterProductUpdate["e_pblsh"] = false;

          arbispotterProductUpdate["e_prc"] = foundProduct.price;
          arbispotterProductUpdate["e_nm"] = replaceAllHiddenCharacters(
            foundProduct.name
          );

          const e_qty = detectQuantity(foundProduct.name);
          if (e_qty) {
            arbispotterProductUpdate["e_qty"] = e_qty;
            arbispotterProductUpdate["e_uprc"] = roundToTwoDecimals(foundProduct.price / e_qty);
          } else {
            arbispotterProductUpdate["e_qty"] = 1;
            arbispotterProductUpdate["e_uprc"] = foundProduct.price;
          }

          const esin = new URL(foundProduct.link).pathname.split("/")[2];
          arbispotterProductUpdate["esin"] = esin;

          const crawlDataProductUpdate = {
            eby_locked: false,
            qty_prop: "",
            e_qty: arbispotterProductUpdate["e_qty"],
            eby_taskId: "",
            esin,
            eby_prop: "complete",
          };
          const updatedProduct = { ...procProd, ...arbispotterProductUpdate };
          const result = await createOrUpdateArbispotterProduct(
            srcShopDomain,
            updatedProduct
          );
          if (result.acknowledged) {
            if (result.upsertedId) infos.new++;
            else infos.old++;
          } else {
            infos.failedSave++;
          }
          await updateCrawlDataProduct(
            srcShopDomain,
            link,
            crawlDataProductUpdate
          );
        } else {
          await updateCrawlDataProduct(srcShopDomain, link, {
            eby_locked: false,
            eby_prop: "missing",
            eby_taskId: "",
          });
        }
        infos.shops[srcShopDomain]++;
        infos.total++;
      };
      const handleNotFound = async () => {
        infos.notFound++;
        infos.shops[srcShopDomain]++;
        infos.total++;

        await updateCrawlDataProduct(srcShopDomain, link, {
          eby_locked: false,
          eby_prop: "missing",
          eby_taskId: "",
        });

        if (infos.total >= _productLimit - 1 && !queue.idle()) {
          await checkProgress({
            queue,
            infos,
            startTime,
            productLimit: _productLimit,
          }).catch(async (r) => {
            clearInterval(interval);
            await updateProgressInQueryEansOnEbyTask(); // update query eans on eby task
            await updateProgressInLookupCategoryTask(); // update lookup category task
            handleResult(r, resolve, reject);
          });
        }
      };

      const queryLink = queryURLBuilder(toolInfo.queryUrlSchema, query).url;

      queue.pushTask(queryEansOnEbyQueue, {
        retries: 0,
        shop: toolInfo,
        targetShop: {
          prefix: "",
          d: srcShopDomain,
          name: srcShopDomain,
        },
        addProduct,
        isFinished,
        onNotFound: handleNotFound,
        queue,
        query,
        prio: 0,
        extendedLookUp: false,
        limit: undefined,
        pageInfo: {
          link: queryLink,
          name: toolInfo.d,
        },
      });
    }
  });
}
