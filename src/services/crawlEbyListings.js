import {
  QueryQueue,
  calculateAznArbitrage,
  calculateEbyArbitrage,
  calculateOnlyArbitrage,
  lookupProductQueue,
  queryProductPageQueue,
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
import { updateCrawlEbyListingsProgress } from "../util/updateProgressInTasks.js";
import { lockProductsForCrawlEbyListings } from "./db/util/crawlEbyListings/lockProductsForCrawlEbyListings.js";
import { updateCrawlDataProduct } from "./db/util/crudCrawlDataProduct.js";

async function crawlEbyListings(task) {
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

    const products = await lockProductsForCrawlEbyListings(
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
    await updateCrawlEbyListingsProgress(shopDomain);

    const startTime = Date.now();

    const shop = await getShop("ebay.de");

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
          await updateCrawlEbyListingsProgress(shopDomain);
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
          const sellPrice = infoMap.get("e_prc");
          const image = infoMap.get("image");
          const arbispotterProductUpdate = {
            e_lnk: url,
          };
          const crawlDataProductUpdate = {
            ebyUpdatedAt: new Date().toISOString(),
            eby_locked: false,
            eby_taskId: "",
          };
          if (sellPrice) {
            const parsedSellPrice = safeParsePrice(sellPrice);
            const arbitrage = calculateEbyArbitrage(
              crawlDataProduct.ebyCategories,
              parsedSellPrice,
              crawlDataProduct.price
            );
            Object.entries(arbitrage).forEach(([key, val]) => {
              arbispotterProductUpdate[key] = val;
            });

            arbispotterProductUpdate["e_prc"] = parsedSellPrice;
          }
          if (image) {
            arbispotterProductUpdate["e_img"] = image;
          }
          await updateCrawlDataProduct(
            shopDomain,
            productLink,
            crawlDataProductUpdate
          );

          await updateArbispotterProduct(
            shopDomain,
            productLink,
            arbispotterProductUpdate
          );
        } else {
          await updateCrawlDataProduct(shopDomain, productLink, {
            eby_locked: false,
            eby_taskId: "",
          });
          await updateArbispotterProduct(shopDomain, productLink, {
            e_lnk: url,
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
            await updateCrawlEbyListingsProgress(shopDomain);
            handleResult(r, resolve, reject);
          });
        }
        infos.total++;
      };
      const handleNotFound = async () => {
        infos.notFound++;
        await updateCrawlDataProduct(shopDomain, productLink, {
          eby_locked: false,
          eby_taskId: "",
        });
        await updateArbispotterProduct(shopDomain, productLink, {
          e_prc: 0,
          esin: "",
          e_lnk: "",
          e_img: "",
          e_mrgn: 0,
          e_mrgn_pct: 0,
          e_ns_mrgn: 0,
          e_ns_mrgn_pct: 0,
          e_nm: "",
        });
        if (infos.total >= _productLimit - 1 && !queue.idle()) {
          await checkProgress({
            queue,
            infos,
            startTime,
            productLimit: _productLimit,
          }).catch(async (r) => {
            clearInterval(interval);
            await updateCrawlEbyListingsProgress(shopDomain);
            handleResult(r, resolve, reject);
          });
        }
        infos.total++;
      };

      let ebyLink = "https://www.ebay.de/itm/" + crawlDataProduct.esin;

      queue.pushTask(queryProductPageQueue, {
        retries: 0,
        shop,
        addProduct,
        onNotFound: handleNotFound,
        addProductInfo,
        queue,
        query: {},
        prio: 0,
        extendedLookUp: false,
        pageInfo: {
          link: ebyLink,
          name: shop.d,
        },
      });
    }
  });
}

export default crawlEbyListings;
