import { updateTask } from "../../services/db/util/tasks.js";
import {
  CrawlerQueue,
  crawlSubpage,
  globalEventEmitter,
  roundToTwoDecimals,
  sleep,
} from "@dipmaxtech/clr-pkg";
import { salesDbName } from "../../services/productPriceComparator.js";
import { MAX_RETIRES_SCRAPE_SHOP, proxyAuth, RECHECK_EAN_EBY_AZN_INTERVAL } from "../../constants.js";
import { parseISO } from "date-fns";
import { transformProduct } from "../../util/transformProduct.js";
import {
  findProductByLink,
  upsertArbispotterProduct,
} from "../../services/db/util/crudArbispotterProduct.js";
import { UTCDate } from "@date-fns/utc";

export const crawlProducts = async (shop, task) =>
  new Promise(async (res, rej) => {
    const { categories, browserConfig, _id, productLimit } = task;
    const { concurrency, limit } = browserConfig.crawlShop;
    const uniqueLinks = [];
    let infos = {
      new: 0,
      old: 0,
      total: 1,
      failedSave: 0,
      categoriesHeuristic: {
        subCategories: {
          0: 0,
          "1-9": 0,
          "10-19": 0,
          "20-29": 0,
          "30-39": 0,
          "40-49": 0,
          "+50": 0,
        },
        mainCategories: 0,
      },
      productPageCountHeuristic: {
        0: 0,
        "1-9": 0,
        "10-49": 0,
        "+50": 0,
      },
      missingProperties: {
        name: 0,
        price: 0,
        link: 0,
        image: 0,
      },
    };
    task.actualProductLimit = productLimit;
    const queue = new CrawlerQueue(concurrency, proxyAuth, task);
    queue.total = 1;

    const eventEmitter = globalEventEmitter;

    eventEmitter.on(
      `${queue.queueId}-finished`,
      async function crawlProductsCallback() {
        interval && clearInterval(interval);
        await updateTask(_id, { $set: { progress: task.progress } });
        await queue.disconnect(true);
        res(infos);
      }
    );

    const interval = setInterval(async () => {
      if (queue.workload() === 0) {
        await sleep(20000);
        if (queue.workload() === 0) {
          interval && clearInterval(interval);
          await queue.disconnect(true);
          res(infos);
        }
      }
    }, 2 * 60 * 1000);

    await queue.connect();

    categories.map((category) => {
      const handleCrawledProduct = async (product) => {
        if (infos.total === productLimit && !queue.idle()) {
          console.log("product limit reached");
          await updateTask(_id, { $set: { progress: task.progress } });
          await queue.disconnect(true);
          res(infos);
        } else {
          const transformedProduct = transformProduct(product);
          const { lnk, nm, prc: buyPrice, qty: buyQty } = transformedProduct;
          if (nm && buyPrice && lnk) {
            if (!uniqueLinks.includes(lnk)) {
              uniqueLinks.push(lnk);
              infos.total++;
              queue.total++;
              transformedProduct["qty"] = buyQty || 1;
              transformedProduct["uprc"] = roundToTwoDecimals(
                buyPrice / transformedProduct["qty"]
              );
              const existingProduct = await findProductByLink(salesDbName, lnk);
              if (existingProduct) {
                const xDaysAgo = new UTCDate();
                xDaysAgo.setDate(
                  xDaysAgo.getDate() - RECHECK_EAN_EBY_AZN_INTERVAL
                );
                infos.old++;
                const {
                  ean_prop, //scrape ean
                  info_prop, // scrape info
                  eby_prop, // query ean on eby
                  cat_prop, // lookup category
                } = existingProduct;

                // hasEan is a flag to check if the product has an ean in the listing
                // ean is the ean that was scraped from the product link

                if (!shop.hasEan && shop.ean) {
                  task.progress.lookupInfo.push(existingProduct._id);
                  task.progress.queryEansOnEby.push(existingProduct._id);
                  return;
                }
                //ean_prop can have the following values: missing, found
                if (
                  !ean_prop ||
                  (ean_prop !== "missing" &&
                    ean_prop !== "invalid" &&
                    ean_prop !== "timeout" &&
                    ean_prop !== "found")
                ) {
                  task.progress.crawlEan.push(existingProduct._id);
                  return;
                }

                // ean_prop is found and info_prop is missing or completed
                // info_prop can have the following values: missing, complete
                if (
                  new UTCDate(parseISO(existingProduct.createdAt)) < xDaysAgo ||
                  (ean_prop === "found" &&
                    (!info_prop ||
                      (info_prop !== "missing" && info_prop !== "complete")))
                ) {
                  task.progress.lookupInfo.push(existingProduct._id);
                }

                if (
                  new UTCDate(parseISO(existingProduct.createdAt)) < xDaysAgo ||
                  (ean_prop === "found" &&
                    (!eby_prop ||
                      (eby_prop !== "missing" && eby_prop !== "complete")))
                ) {
                  task.progress.queryEansOnEby.push(existingProduct._id);
                }

                if (
                  eby_prop === "complete" &&
                  (!cat_prop ||
                    (cat_prop !== "complete" &&
                      cat_prop !== "timeout" &&
                      cat_prop !== "ean_missing" &&
                      cat_prop !== "ean_missmatch" &&
                      cat_prop !== "categories_missing" &&
                      cat_prop !== "category_not_found"))
                ) {
                  task.progress.lookupCategory.push(existingProduct._id);
                }

                if (cat_prop === "complete" && eby_prop === "complete") {
                  task.progress.ebyListings.push(existingProduct._id);
                }

                if (info_prop === "complete") {
                  task.progress.aznListings.push(existingProduct._id);
                }
              } else {
                const result = await upsertArbispotterProduct(
                  salesDbName,
                  transformedProduct
                );
                if (result.acknowledged) {
                  if (result.upsertedId) {
                    task.progress.crawlEan.push(result.upsertedId);
                    infos.new++;
                  } else {
                    infos.old++;
                  }
                } else {
                  infos.failedSave++;
                }
              }
            }
          } else {
            const properties = ["nm", "prc", "lnk", "img"];
            properties.forEach((prop) => {
              if (!product[prop]) {
                infos.missingProperties[prop]++;
              }
            });
          }
        }
      };
      queue.pushTask(crawlSubpage, {
        shop,
        addProduct: handleCrawledProduct,
        categoriesHeuristic: infos.categoriesHeuristic,
        productPageCountHeuristic: infos.productPageCountHeuristic,
        limit,
        retriesOnFail: MAX_RETIRES_SCRAPE_SHOP,
        queue: queue,
        retries: 0,
        prio: 0,
        pageInfo: {
          entryCategory: category.name,
          link: category.link,
          name: category.name,
        },
      });
    });
  });
