import {
  calculateEbyArbitrage,
  findMappedCategory,
  globalEventEmitter,
  queryProductPageQueue,
  QueryQueue,
  roundToTwoDecimals,
  safeParsePrice,
} from "@dipmaxtech/clr-pkg";
import { defaultQuery, proxyAuth } from "../../constants.js";
import { updateCrawlDataProduct } from "../../services/db/util/crudCrawlDataProduct.js";
import { updateArbispotterProduct } from "../../services/db/util/crudArbispotterProduct.js";
import { salesDbName } from "../../services/productPriceComparator.js";
import { resetEbayProduct } from "../../services/lookupCategory.js";
import { updateTask } from "../../services/db/util/tasks.js";

export const crawlEbyListings = (ebay, task) =>
  new Promise(async (res, rej) => {
    let infos = {
      new: 0,
      total: 1,
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
    const { browserConfig, _id, shopDomain } = task;
    const { concurrency, productLimit } = browserConfig.crawlEbyListings;

    task.actualProductLimit = task.ebyListings.length
    const queue = new QueryQueue(concurrency, proxyAuth, task);

    const eventEmitter = globalEventEmitter;

    eventEmitter.on(
      `${queue.queueId}-finished`,
      async function crawlEbyListingEventCallback() {
        await updateTask(_id, { $set: { progress: task.progress } });
        await queue.disconnect(true);
        res(infos);
      }
    );

    await queue.connect();
    while (task.progress.ebyListings.length) {
      const crawlDataProduct = task.ebyListings.pop();
      task.progress.ebyListings.pop();
      if (!crawlDataProduct) continue;
      const productLink = crawlDataProduct.link;

      const addProduct = async (product) => {};
      const addProductInfo = async ({ productInfo, url }) => {
        infos.total++;
        queue.total++;
        if (productInfo) {
          const infoMap = new Map();
          productInfo.forEach((info) => infoMap.set(info.key, info.value));
          const rawSellPrice = infoMap.get("e_prc");
          const image = infoMap.get("image");
          const arbispotterProductUpdate = {
            e_lnk: url.split("?")[0],
          };
          const crawlDataProductUpdate = {
            ebyUpdatedAt: new Date().toISOString(),
            eby_locked: false,
            eby_taskId: "",
          };
          const {
            e_qty: buyQty,
            price: buyPrice,
            qfty: sellQty,
          } = crawlDataProduct;
          if (rawSellPrice) {
            const parsedSellPrice = safeParsePrice(rawSellPrice);

            arbispotterProductUpdate["e_prc"] = parsedSellPrice;
            arbispotterProductUpdate["e_uprc"] = roundToTwoDecimals(
              parsedSellPrice / crawlDataProduct.e_qty
            );
            const mappedCategory = findMappedCategory(
              crawlDataProduct.ebyCategories.reduce((acc, curr) => {
                acc.push(curr.id);
                return acc;
              }, [])
            );
            const { e_prc: sellPrice } = arbispotterProductUpdate;
            if (mappedCategory) {
              const arbitrage = calculateEbyArbitrage(
                mappedCategory,
                sellPrice, // e_prc, //VK
                buyPrice * (buyQty / sellQty) // prc * (e_qty / qty) //EK  //QTY Zielshop/QTY Herkunftsshop
              );
              if (arbitrage)
                Object.entries(arbitrage).forEach(([key, val]) => {
                  arbispotterProductUpdate[key] = val;
                });
            }
          }
          if (image) {
            arbispotterProductUpdate["e_img"] = image;
          }
          await updateCrawlDataProduct(
            salesDbName,
            productLink,
            crawlDataProductUpdate
          );

          await updateArbispotterProduct(
            salesDbName,
            productLink,
            arbispotterProductUpdate
          );
        } else {
          await updateCrawlDataProduct(salesDbName, productLink, {
            eby_locked: false,
            eby_taskId: "",
            esin: "",
            e_qty: 0,
            cat_prop: "", // lookup category
            eby_prop: "", //  query eans on eby
          });
          await updateArbispotterProduct(
            salesDbName,
            productLink,
            resetEbayProduct
          );
          infos.notFound++;
        }
        if (infos.total === productLimit && !queue.idle()) {
          console.log("product limit reached");
          await updateTask(_id, { $set: { progress: task.progress } });
          await queue.disconnect(true);
          res(infos);
        }
      };
      const handleNotFound = async () => {
        infos.notFound++;
        infos.total++;
        queue.total++;
        await updateCrawlDataProduct(salesDbName, productLink, {
          eby_locked: false,
          eby_taskId: "",
          esin: "",
          e_qty: 0,
          cat_prop: "", // lookup category
          eby_prop: "", //  query eans on eby
        });
        await updateArbispotterProduct(
          salesDbName,
          productLink,
          resetEbayProduct
        );
        if (infos.total === productLimit && !queue.idle()) {
          console.log("product limit reached");
          await updateTask(_id, { $set: { progress: task.progress } });
          await queue.disconnect(true);
          res(infos);
        }
      };

      let ebyLink = "https://www.ebay.de/itm/" + crawlDataProduct.esin;

      queue.pushTask(queryProductPageQueue, {
        retries: 0,
        shop: ebay,
        addProduct,
        onNotFound: handleNotFound,
        addProductInfo,
        queue,
        query: defaultQuery,
        prio: 0,
        extendedLookUp: false,
        pageInfo: {
          link: ebyLink,
          name: ebay.d,
        },
      });
    }
  });
