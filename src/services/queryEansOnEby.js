import {
  QueryQueue,
  queryEansOnEbyQueue,
  queryURLBuilder,
  replaceAllHiddenCharacters,
  roundToTwoDecimals,
} from "@dipmaxtech/clr-pkg";
import _ from "underscore";

import { handleResult } from "../handleResult.js";
import { MissingProductsError } from "../errors.js";
import {
  CONCURRENCY,
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  defaultQuery,
  proxyAuth,
} from "../constants.js";
import { checkProgress } from "../util/checkProgress.js";
import {
  updateProgressInLookupCategoryTask,
  updateProgressInQueryEansOnEbyTask,
} from "../util/updateProgressInTasks.js";
import { lookForUnmatchedQueryEansOnEby } from "./db/util/queryEansOnEby/lookForUnmatchedEansOnEby.js";
import { createHash } from "../util/hash.js";
import { getShop } from "./db/util/shops.js";
import { createArbispotterCollection } from "./db/mongo.js";
import {
  updateArbispotterProductQuery,
} from "./db/util/crudArbispotterProduct.js";

export default async function queryEansOnEby(task) {
  return new Promise(async (resolve, reject) => {
    const { productLimit, _id, action, proxyType, type } = task;

    let infos = {
      new: 0,
      total: 1,
      old: 0,
      notFound: 0,
      locked: 0,
      shops: {},
      missingProperties: {},
    };

    const { products, shops } = await lookForUnmatchedQueryEansOnEby(
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
    task.actualProductLimit = _productLimit;

    infos.locked = products.length;

    //Update task progress
    await updateProgressInQueryEansOnEbyTask();

    const startTime = Date.now();

    const queue = new QueryQueue(
      task?.concurrency ? task.concurrency : CONCURRENCY,
      proxyAuth,
      task
    );
    queue.total = 1;
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

    async function isProcessComplete() {
      if (infos.total === _productLimit && !queue.idle()) {
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
    }

    for (let index = 0; index < products.length; index++) {
      const { shop, product } = products[index];
      const srcShopDomain = shop.d;
      let { ean, e_qty: sellQty, lnk: productLink } = product;

      const foundProducts = [];

      const addProduct = async (product) => {
        foundProducts.push(product);
      };
      const isFinished = async () => {
        infos.shops[srcShopDomain]++;
        infos.total++;
        queue.total++;
        let productUpdate = {};
        const foundProduct = foundProducts.find((p) => p.link && p.price);
        if (foundProduct) {
          const { image, price, name, link } = foundProduct;
          const shortLink = foundProduct.link.split("?")[0];
          const esin = new URL(link).pathname.split("/")[2];

          productUpdate["e_img"] = image;
          productUpdate["e_lnk"] = shortLink;
          productUpdate["e_hash"] = createHash(shortLink);
          productUpdate["eanList"] = [ean];
          productUpdate["e_orgn"] = "e";
          productUpdate["e_pblsh"] = false;
          productUpdate["esin"] = esin;
          productUpdate["e_prc"] = price;
          productUpdate["e_nm"] = replaceAllHiddenCharacters(name);

          if (sellQty) {
            productUpdate["e_qty"] = sellQty;
            productUpdate["e_uprc"] = roundToTwoDecimals(price / sellQty);
          } else {
            productUpdate["e_qty"] = 1;
            productUpdate["e_uprc"] = price;
          }
          await updateArbispotterProductQuery(srcShopDomain, productLink, {
            $set: {
              ...productUpdate,
              eby_prop: "complete",
            },
            $unset: {
              eby_taskId: "",
            },
          });
        } else {
          await updateArbispotterProductQuery(srcShopDomain, productLink, {
            $set: {
              eby_prop: "missing",
            },
            $unset: {
              eby_taskId: "",
            },
          });
        }
        await isProcessComplete();
      };
      const handleNotFound = async () => {
        infos.notFound++;
        infos.shops[srcShopDomain]++;
        infos.total++;
        queue.total++;

        await updateArbispotterProductQuery(srcShopDomain, productLink, {
          $set: {
            eby_prop: "missing",
          },
          $unset: {
            eby_taskId: "",
          },
        });
        await isProcessComplete();
      };
      const query = {
        ...defaultQuery,
        product: {
          value: ean,
          key: ean,
        },
        category: "default",
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
