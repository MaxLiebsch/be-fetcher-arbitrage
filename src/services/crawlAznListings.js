import {
  QueryQueue,
  calculateAznArbitrage,
  calculateOnlyArbitrage,
  lookupProductQueue,
  roundToTwoDecimals,
  safeParsePrice,
} from "@dipmaxtech/clr-pkg";
import _ from "underscore";

import { handleResult } from "../handleResult.js";
import { MissingProductsError, MissingShopError } from "../errors.js";
import { updateArbispotterProduct } from "./db/util/crudArbispotterProduct.js";
import {
  CONCURRENCY,
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  proxyAuth,
} from "../constants.js";
import { getShop, getShops } from "./db/util/shops.js";
import { checkProgress } from "../util/checkProgress.js";
import { updateCrawlAznListingsProgress } from "../util/updateProgressInTasks.js";
import { lockProductsForCrawlAznListings } from "./db/util/crawlAznListings/lockProductsForCrawlAznListings.js";
import { updateCrawlDataProduct } from "./db/util/crudCrawlDataProduct.js";
import { resetAznProduct } from "./lookupInfo.js";

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

    const amazonShop = await getShop("amazon.de");

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
      const crawlDataProduct = products[index];
      const productLink = crawlDataProduct.link;
      const addProduct = async (product) => {};
      const addProductInfo = async ({ productInfo, url }) => {
        if (productInfo) {
          const infoMap = new Map();
          productInfo.forEach((info) => infoMap.set(info.key, info.value));
          const price = infoMap.get("a_prc");
          const image = infoMap.get("a_img");
          const bsr = infoMap.get("bsr");
          const arbispotterProductUpdate = {};
          const crawlDataProductUpdate = {
            aznUpdatedAt: new Date().toISOString(),
            azn_locked: false,
            azn_taskId: "",
          };
          if (price) {
            const parsedPrice = safeParsePrice(price);
            arbispotterProductUpdate["a_prc"] = parsedPrice;
            arbispotterProductUpdate["a_uprc"] = roundToTwoDecimals(
              parsedPrice / crawlDataProduct.a_qty
            );

            if (crawlDataProduct?.costs) {
              const arbitrage = calculateAznArbitrage(
                crawlDataProduct.uprc,
                arbispotterProductUpdate["a_uprc"],
                crawlDataProduct.costs
              );
              Object.entries(arbitrage).forEach(([key, val]) => {
                arbispotterProductUpdate[key] = val;
              });
            } else {
              const arbitrage = calculateOnlyArbitrage(
                crawlDataProduct.price,
                parsedPrice
              );
              Object.entries(arbitrage).forEach(([key, val]) => {
                arbispotterProductUpdate[`a_${key}`] = val;
              });
            }
          }
          if (image) {
            arbispotterProductUpdate["a_img"] = image;
          }
          if (bsr) {
            arbispotterProductUpdate["bsr"] = bsr;
          }
          await updateArbispotterProduct(
            shopDomain,
            productLink,
            arbispotterProductUpdate
          );
          await updateCrawlDataProduct(
            shopDomain,
            productLink,
            crawlDataProductUpdate
          );
        } else {
          infos.missingProperties.bsr++;
          await updateCrawlDataProduct(shopDomain, productLink, {
            azn_locked: false,
            azn_taskId: "",
          });
          await updateArbispotterProduct(shopDomain, productLink, {
            a_lnk: url.split("?")[0],
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
        await updateCrawlDataProduct(shopDomain, productLink, {
          azn_locked: false,
          azn_taskId: "",
        });
        await updateArbispotterProduct(
          shopDomain,
          productLink,
          resetAznProduct
        );
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

      let aznLink =
        "https://www.amazon.de/dp/product/" +
        crawlDataProduct.asin +
        "?language=de_DE";

      queue.pushTask(lookupProductQueue, {
        retries: 0,
        shop: amazonShop,
        addProduct,
        onNotFound: handleNotFound,
        addProductInfo,
        queue,
        query: {},
        prio: 0,
        extendedLookUp: false,
        pageInfo: {
          link: aznLink,
          name: amazonShop.d,
        },
      });
    }
  });
}
