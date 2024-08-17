import {
  calculateAznArbitrage,
  globalEventEmitter,
  queryProductPageQueue,
  QueryQueue,
  roundToTwoDecimals,
  safeParsePrice,
} from "@dipmaxtech/clr-pkg";
import { defaultQuery, proxyAuth } from "../../constants.js";
import { updateCrawlDataProduct } from "../../services/db/util/crudCrawlDataProduct.js";
import { updateArbispotterProduct } from "../../services/db/util/crudArbispotterProduct.js";
import { resetAznProduct } from "../../services/lookupInfo.js";
import { salesDbName } from "../../services/productPriceComparator.js";
import { updateTask } from "../../services/db/util/tasks.js";

export const scrapeAznListings = (amazon, origin, task) =>
  new Promise(async (res, rej) => {
    const { browserConfig, _id } = task;
    const { concurrency, productLimit } = browserConfig.crawlAznListings;

    let infos = {
      new: 0,
      total: 1,
      old: 0,
      notFound: 0,
      locked: 0,
      missingProperties: {
        aznPrice: {
          a_prc_test_3: 0,
          a_prc_test_2: 0,
          a_prc_test_1: 0,
          a_prc: 0,
        },
        bsr: 0,
        name: 0,
        link: 0,
        image: 0,
      },
    };

    task.actualProductLimit = task.aznListings.length;
    const queue = new QueryQueue(concurrency, proxyAuth, task);
    await queue.connect();
    const eventEmitter = globalEventEmitter;

    eventEmitter.on(
      `${queue.queueId}-finished`,
      async function lookupCategoryCallback() {
        await isProcessComplete();
      }
    );
    const isProcessComplete = async () => {
      if (infos.total >= productLimit && !queue.idle()) {
        console.log("infos:", infos.total, "limit: ", productLimit);
        await updateTask(_id, { $set: { progress: task.progress } });
        await queue.disconnect(true);
        res(infos);
      }
    };

    while (task.progress.aznListings.length) {
      task.progress.aznListings.pop();
      const product = task.aznListings.pop();
      if (!product) continue;
      const {
        link: productLink,
        asin,
        uprc: unitPrice,
        price: buyPrice,
        a_qty,
        qty,
        costs,
        tax,
      } = product;

      const addProduct = async (product) => {};
      const addProductInfo = async ({ productInfo, url }) => {
        infos.total++;
        queue.total++;
        let processedProductUpdate = {};
        const crawlDataUpdate = {};
        if (productInfo) {
          console.log("productInfo:", productInfo, url);
          const infoMap = new Map();
          productInfo.forEach((info) => {
            infoMap.set(info.key, info.value);
          });
          const azn_prc_test_1 = safeParsePrice(infoMap.get("a_prc_test_1"));
          if (!azn_prc_test_1) {
            infos.missingProperties.aznPrice.a_prc_test_1++;
          }
          const azn_prc_test_2 = safeParsePrice(infoMap.get("a_prc_test_2"));
          if (!azn_prc_test_2) {
            infos.missingProperties.aznPrice.a_prc_test_2++;
          }
          const azn_prc_test_3 = safeParsePrice(infoMap.get("a_prc_test_3"));
          if (!azn_prc_test_3) {
            infos.missingProperties.aznPrice.a_prc_test_3++;
          }
          let a_prc = safeParsePrice(infoMap.get("a_prc") ?? "0");
          if (a_prc > 0) {
            if (product.costs.azn === 0) {
              console.log("costs.azn === 0");
              crawlDataUpdate["info_prop"] = "";
              processedProductUpdate = {
                ...processedProductUpdate,
                ...resetAznProduct(),
              };
            } else {
              const multiplier = roundToTwoDecimals(costs.azn / a_prc);
              const newCosts = {
                ...costs,
                azn: roundToTwoDecimals(a_prc * multiplier),
              };
              const arbitrage = calculateAznArbitrage(
                buyPrice * (a_qty / qty),
                a_prc,
                newCosts,
                tax
              );
              processedProductUpdate = {
                ...processedProductUpdate,
                ...arbitrage,
                costs: newCosts,
              };
              crawlDataUpdate["costs"] = newCosts;
            }
          } else {
            infos.missingProperties.aznPrice.a_prc++;
            infos.notFound++;
            crawlDataUpdate["info_prop"] = "";
            processedProductUpdate = {
              ...processedProductUpdate,
              ...resetAznProduct(),
            };
          }

          const arbispotterProductUpdate = {
            ...processedProductUpdate,
            aznUpdatedAt: new Date().toISOString(),
          };
          await updateArbispotterProduct(
            salesDbName,
            productLink,
            arbispotterProductUpdate
          );

          if (Object.keys(crawlDataUpdate).length > 0) {
            await updateCrawlDataProduct(
              salesDbName,
              productLink,
              crawlDataUpdate
            );
          }
        } else {
          infos.notFound++;
          crawlDataUpdate["info_prop"] = "";
          await updateArbispotterProduct(
            salesDbName,
            productLink,
            resetAznProduct()
          );
          await updateCrawlDataProduct(
            salesDbName,
            productLink,
            crawlDataUpdate
          );
        }
        await isProcessComplete();
      };
      const handleNotFound = async () => {
        infos.notFound++;
        infos.total++;
        queue.total++;
        await updateCrawlDataProduct(salesDbName, productLink, {
          azn_taskId: "",
          info_prop: "", // reset lookup info to start over
          asin: "",
          a_qty: 0,
        });
        await updateArbispotterProduct(
          salesDbName,
          productLink,
          resetAznProduct()
        );
        await isProcessComplete();
      };

      let aznLink =
        "https://www.amazon.de/dp/product/" + asin + "?language=de_DE";

      queue.pushTask(queryProductPageQueue, {
        retries: 0,
        shop: amazon,
        addProduct,
        onNotFound: handleNotFound,
        addProductInfo,
        queue,
        query: defaultQuery,
        prio: 0,
        extendedLookUp: false,
        pageInfo: {
          link: aznLink,
          name: amazon.d,
        },
      });
    }
  });
