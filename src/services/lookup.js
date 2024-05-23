import { QueryQueue, lookupProductQueue } from "@dipmaxtech/clr-pkg";
import _ from "underscore";

import { handleResult } from "../handleResult.js";
import { MissingProductsError, MissingShopError } from "../errors.js";
import {
  lockArbispotterProducts,
  updateProduct,
} from "./db/util/crudArbispotterProduct.js";

import {
  CONCURRENCY,
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  proxyAuth,
} from "../constants.js";
import { getShops } from "./db/util/shops.js";
import { checkProgress } from "../util/checkProgress.js";

export default async function lookup(task) {
  return new Promise(async (resolve, reject) => {
    const { shopDomain, productLimit } = task;
    let done = 0;

    const products = await lockArbispotterProducts(
      shopDomain,
      productLimit,
      task._id,
      task?.action
    );

    if (!products.length)
      return reject(
        new MissingProductsError(`No products for ${shopDomain}`, task)
      );

    const startTime = Date.now();

    const targetShop = { d: "amazon.de", n: "Amazon" };

    const shops = await getShops([targetShop]);
    const shop = shops["amazon.de"];

    if (shops === null) return reject(new MissingShopError("", task));

    const queue = new QueryQueue(
      task?.concurrency ? task.concurrency : CONCURRENCY,
      proxyAuth,
      task
    );
    await queue.connect();

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

    for (let index = 0; index < products.length; index++) {
      const rawProd = products[index];

      const addProduct = async (product) => {};
      const addProductInfo = async (productInfo) => {
        if (productInfo) {
          const bsr = productInfo.find((info) => info.key === "bsr");
          const asin = productInfo.find((info) => info.key === "asin");
          const price = productInfo.find((info) => info.key === "a_prc");
          const img = productInfo.find((info) => info.key === "a_img");

          const update = {
            bsr: bsr?.value ?? [],
            asin: asin?.value ?? "",
            a_props: "complete",
            lckd: false,
            taskId: "",
          };
          if (price && price > 0) {
            update["a_prc"] = price.value;
          }
          if (img) {
            update["a_img"] = img.value;
          }
          update["updatedAt"] = new Date().toISOString();

          await updateProduct(shopDomain, rawProd.lnk, update);
        } else {
          await updateProduct(shopDomain, rawProd.lnk, {
            lckd: false,
            a_props: "missing",
            taskId: "",
            updatedAt: new Date().toISOString(),
          });
        }
        done++;
        if (done >= productLimit && !queue.idle()) {
          await checkProgress({ queue, done, startTime, productLimit }).catch(
            async (r) => {
              clearInterval(interval);
              handleResult(r, resolve, reject);
            }
          );
        }
      };
      const handleNotFound = async () => {
        await updateProduct(shopDomain, rawProd.lnk, {
          lckd: false,
          taskId: "",
          a_prc: 0,
          a_lnk: "",
          a_img: "",
          a_mrgn: 0,
          a_mrgn_pct: 0,
          a_fat: false,
          a_nm: "",
        });
        done++;
        if (done >= productLimit && !queue.idle()) {
          await checkProgress({ queue, done, startTime, productLimit }).catch(
            async (r) => {
              clearInterval(interval);
              handleResult(r, resolve, reject);
            }
          );
        }
      };

      if (rawProd.a_lnk)
        queue.pushTask(lookupProductQueue, {
          retries: 0,
          shop,
          addProduct,
          targetShop,
          onNotFound: handleNotFound,
          addProductInfo,
          queue,
          query: {},
          prio: 0,
          extendedLookUp: false,
          limit: undefined,
          prodInfo: undefined,
          isFinished: undefined,
          pageInfo: {
            link: rawProd.a_lnk,
            name: shop.d,
          },
        });
      else {
        await updateProduct(shopDomain, rawProd.lnk, {
          lckd: false,
          updatedAt: new Date().toISOString(),
          taskId: "",
          a_prc: 0,
          a_lnk: "",
          a_img: "",
          a_mrgn: 0,
          a_mrgn_pct: 0,
          a_fat: false,
          a_nm: "",
        });
        done++;
      }
    }
  });
}
