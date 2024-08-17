import {
  QueryQueue,
  calculateEbyArbitrage,
  findMappedCategory,
  queryProductPageQueue,
  roundToTwoDecimals,
  safeParsePrice,
} from "@dipmaxtech/clr-pkg";
import _ from "underscore";

import { handleResult } from "../handleResult.js";
import { MissingProductsError } from "../errors.js";
import {
  updateArbispotterProductQuery,
  updateArbispotterProductSet,
} from "./db/util/crudArbispotterProduct.js";
import {
  CONCURRENCY,
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  defaultQuery,
  proxyAuth,
} from "../constants.js";
import { getShop } from "./db/util/shops.js";
import { checkProgress } from "../util/checkProgress.js";
import {
  updateCrawlEbyListingsProgress,
  updateProgressInQueryEansOnEbyTask,
} from "../util/updateProgressInTasks.js";
import { lockProductsForCrawlEbyListings } from "./db/util/crawlEbyListings/lockProductsForCrawlEbyListings.js";
import { resetEbyProductQuery } from "./db/util/ebyQueries.js";

async function crawlEbyListings(task) {
  return new Promise(async (resolve, reject) => {
    const { shopDomain, productLimit, _id, action } = task;

    let infos = {
      new: 0,
      total: 1,
      old: 0,
      notFound: 0,
      locked: 0,
      missingProperties: {
        mappedCat: 0,
        calculationFailed: 0,
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
    task.actualProductLimit = _productLimit;

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
    queue.total = 1;
    await queue.connect();

    const isComplete = async () => {
      if (infos.total === _productLimit && !queue.idle()) {
        await checkProgress({
          queue,
          infos,
          startTime,
          productLimit: _productLimit,
        }).catch(async (r) => {
          clearInterval(interval);
          await updateCrawlEbyListingsProgress(shopDomain);
          await updateProgressInQueryEansOnEbyTask(); // update query eans on eby task
          handleResult(r, resolve, reject);
        });
      }
    };

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
          await updateProgressInQueryEansOnEbyTask(); // update query eans on eby task
          handleResult(r, resolve, reject);
        }),
      DEFAULT_CHECK_PROGRESS_INTERVAL
    );

    for (let index = 0; index < products.length; index++) {
      const product = products[index];
      const {
        lnk: productLink,
        e_qty: buyQty,
        prc: buyPrice,
        qty: sellQty,
        esin,
        ebyCategories,
      } = product;

      const addProduct = async (product) => {};
      const addProductInfo = async ({ productInfo, url }) => {
        infos.total++;
        queue.total++;
        if (productInfo) {
          const infoMap = new Map();
          productInfo.forEach((info) => infoMap.set(info.key, info.value));
          const rawSellPrice = infoMap.get("e_prc");
          const image = infoMap.get("image");
          let productUpdate = {
            e_lnk: url.split("?")[0],
          };
          if (rawSellPrice) {
            const parsedSellPrice = safeParsePrice(rawSellPrice);
            productUpdate = {
              ...productUpdate,
              e_prc: parsedSellPrice,
              e_uprc: roundToTwoDecimals(parsedSellPrice / buyQty),
            };

            const mappedCategory = findMappedCategory(
              ebyCategories.reduce((acc, curr) => {
                acc.push(curr.id);
                return acc;
              }, [])
            );
            const { e_prc: sellPrice } = productUpdate;
            if (mappedCategory) {
              const arbitrage = calculateEbyArbitrage(
                mappedCategory,
                sellPrice, // e_prc, //VK
                buyPrice * (buyQty / sellQty) // prc * (e_qty / qty) //EK  //QTY Zielshop/QTY Herkunftsshop
              );
              if (arbitrage) {
                Object.entries(arbitrage).forEach(([key, val]) => {
                  productUpdate[key] = val;
                });
                productUpdate = {
                  ...productUpdate,
                  ebyUpdatedAt: new Date().toISOString(),
                  eby_taskId: "",
                  ...(image && { e_img: image }),
                };

                await updateArbispotterProductSet(
                  shopDomain,
                  productLink,
                  productUpdate
                );
              } else {
                infos.missingProperties.calculationFailed++;
                await updateArbispotterProductQuery(
                  shopDomain,
                  productLink,
                  resetEbyProductQuery()
                );
              }
            } else {
              infos.missingProperties.mappedCat++;
              await updateArbispotterProductQuery(
                shopDomain,
                productLink,
                resetEbyProductQuery()
              );
            }
          } else {
            infos.missingProperties.price++;
            await updateArbispotterProductQuery(
              shopDomain,
              productLink,
              resetEbyProductQuery()
            );
          }
        } else {
          await updateArbispotterProductQuery(
            shopDomain,
            productLink,
            resetEbyProductQuery()
          );
          infos.notFound++;
        }
        await isComplete();
      };

      const handleNotFound = async () => {
        console.log('not found at all')
        infos.notFound++;
        infos.total++;
        queue.total++;
        await updateArbispotterProductQuery(
          shopDomain,
          productLink,
          resetEbyProductQuery()
        );
        await isComplete();
      };

      let ebyLink = "https://www.ebay.de/itm/" + esin;

      queue.pushTask(queryProductPageQueue, {
        retries: 0,
        shop,
        addProduct,
        onNotFound: handleNotFound,
        addProductInfo,
        queue,
        query: defaultQuery,
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
