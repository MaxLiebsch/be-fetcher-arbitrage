import {
  QueryQueue,
  calculateAznArbitrage,
  calculateOnlyArbitrage,
  lookupProductQueue,
  safeParsePrice,
} from "@dipmaxtech/clr-pkg";
import _ from "underscore";

import { handleResult } from "../handleResult.js";
import { MissingProductsError, MissingShopError } from "../errors.js";
import { updateProduct } from "./db/util/crudArbispotterProduct.js";
import {
  CONCURRENCY,
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  proxyAuth,
} from "../constants.js";
import { getShops } from "./db/util/shops.js";
import { checkProgress } from "../util/checkProgress.js";
import { updateCrawlAznListingsProgress } from "../util/updateProgressInTasks.js";
import { lockProductsForCrawlAznListings } from "./db/util/lockProductsForCrawlAznListings.js";

export default async function crawlAznListings(task) {
  return new Promise(async (resolve, reject) => {
    const { shopDomain, productLimit, _id, action } = task;

    let infos = {
      new: 0,
      total: 0,
      old: 0,
      notFound: 0,
      locked: 0,
      missingProperties: {
        bsr: 0,
        name: 0,
        price: 0,
        link: 0,
        image: 0,
      },
    };

    const products = await lockProductsForCrawlAznListings(
      shopDomain,
      productLimit,
      _id,
      action
    );

    if (!products.length)
      return reject(
        new MissingProductsError(`No products for ${shopDomain}`, task)
      );

    const _productLimit =
      products.length < productLimit ? products.length : productLimit;

    infos.locked = products.length;

    //Update task progress
    await updateCrawlAznListingsProgress(shopDomain);

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
        await checkProgress({
          queue,
          infos,
          startTime,
          productLimit: _productLimit,
        }).catch(async (r) => {
          clearInterval(interval);
          await updateCrawlAznListingsProgress(shopDomain);
          handleResult(r, resolve, reject);
        }),
      DEFAULT_CHECK_PROGRESS_INTERVAL
    );

    for (let index = 0; index < products.length; index++) {
      const rawProd = products[index];

      const addProduct = async (product) => {};
      const addProductInfo = async ({ productInfo, url }) => {
        if (productInfo) {
          const infoMap = new Map();
          productInfo.forEach((info) => infoMap.set(info.key, info.value));
          const price = infoMap.get("a_prc");
          const image = infoMap.get('a_img');
          const bsr = infoMap.get("bsr");
          const update = {
            aznUpdatedAt: new Date().toISOString(),
            lckd: false,
            taskId: "",
            a_lnk: url,
          };
          if (price) {
            const parsedPrice = safeParsePrice(price);
            if (rawProd?.costs) {
              const arbitrage = calculateAznArbitrage(
                rawProd.prc,
                parsedPrice,
                rawProd.costs
              );
              Object.entries(arbitrage).forEach(([key, val]) => {
                update[key] = val;
              });
            } else {
              const arbitrage = calculateOnlyArbitrage(
                rawProd.prc,
                parsedPrice
              );
              Object.entries(arbitrage).forEach(([key, val]) => {
                update[`a_${key}`] = val;
              });
            }
            update["a_prc"] = parsedPrice;
          }
          if(image){
            update["a_img"] = image;
          }
          if (bsr) {
            update["bsr"] = bsr;
          }

          await updateProduct(shopDomain, rawProd.lnk, update);
        } else {
          infos.missingProperties.bsr++;
          await updateProduct(shopDomain, rawProd.lnk, {
            lckd: false,
            a_lnk: url,
            taskId: "",
          });
        }
        if (infos.total >= _productLimit - 1 && !queue.idle()) {
          await checkProgress({
            queue,
            infos,
            startTime,
            productLimit: _productLimit,
          }).catch(async (r) => {
            clearInterval(interval);
            await updateCrawlAznListingsProgress(shopDomain);
            handleResult(r, resolve, reject);
          });
        }
        infos.total++;
      };
      const handleNotFound = async () => {
        infos.notFound++;
        await updateProduct(shopDomain, rawProd.lnk, {
          lckd: false,
          taskId: "",
          a_prc: 0,
          a_lnk: "",
          a_img: "",
          a_mrgn: 0,
          a_mrgn_pct: 0,
          a_nm: "",
        });
        if (infos.total >= _productLimit - 1 && !queue.idle()) {
          await checkProgress({
            queue,
            infos,
            startTime,
            productLimit: _productLimit,
          }).catch(async (r) => {
            clearInterval(interval);
            await updateCrawlAznListingsProgress(shopDomain);
            handleResult(r, resolve, reject);
          });
        }
        infos.total++;
      };

      if (rawProd.a_lnk) {
        let link = rawProd.a_lnk;
        if (
          !rawProd.a_lnk.includes("&language=") &&
          rawProd.a_lnk.includes("amazon.de")
        ) {
          link = rawProd.a_lnk + "&language=de_DE";
        }

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
            link,
            name: shop.d,
          },
        });
      } else {
        await updateProduct(shopDomain, rawProd.lnk, {
          lckd: false,
          taskId: "",
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
        infos.total++;
      }
    }
  });
}
