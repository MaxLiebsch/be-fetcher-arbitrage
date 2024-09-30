import { updateTask } from "../../db/util/tasks.js";
import {
  CrawlerQueue,
  crawlSubpage,
  DbProductRecord,
  globalEventEmitter,
  ProductRecord,
  roundToTwoDecimals,
  Shop,
  sleep,
  transformProduct,
  uuid,
} from "@dipmaxtech/clr-pkg";
import { parseISO } from "date-fns";
import { UTCDate } from "@date-fns/utc";
import {
  MAX_RETIRES_SCRAPE_SHOP,
  proxyAuth,
  RECHECK_EAN_EBY_AZN_INTERVAL,
} from "../../constants.js";
import {
  findProductByHash,
  insertArbispotterProduct,
  updateArbispotterProductQuery,
} from "../../db/util/crudArbispotterProduct.js";
import { salesDbName } from "../../db/mongo.js";
import { DailySalesTask } from "../../types/tasks/DailySalesTask.js";
import { ScrapeShopStats } from "../../types/taskStats/ScrapeShopStats.js";
import { MultiStageReturnType } from "../../types/DailySalesReturnType.js";
import { log } from "../../util/logger.js";

export const scrapeProducts = async (
  shop: Shop,
  task: DailySalesTask
): Promise<MultiStageReturnType> =>
  new Promise(async (res, rej) => {
    const { categories, browserConfig, _id: taskId, productLimit } = task;
    const { d: shopDomain, hasEan, ean } = shop;
    const { concurrency, limit } = browserConfig.crawlShop;
    const uniqueLinks: string[] = [];
    let infos: ScrapeShopStats = {
      new: 0,
      old: 0,
      total: 0,
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
        nm: 0,
        prc: 0,
        lnk: 0,
        img: 0,
      },
      locked: 0,
      notFound: 0,
      elapsedTime: "",
    };
    task.actualProductLimit = productLimit;
    const queue = new CrawlerQueue(concurrency, proxyAuth, task);
    queue.total = 0;

    const eventEmitter = globalEventEmitter;

    eventEmitter.on(
      `${queue.queueId}-finished`,
      async function crawlProductsCallback() {
        interval && clearInterval(interval);
        await updateTask(taskId, { $set: { progress: task.progress } });
        await queue.disconnect(true);
        res({ infos, queueStats: queue.queueStats });
      }
    );

    const interval = setInterval(async () => {
      if (queue.workload() === 0) {
        await sleep(20000);
        if (queue.workload() === 0) {
          interval && clearInterval(interval);
          await queue.disconnect(true);
          res({ infos, queueStats: queue.queueStats });
        }
      }
    }, 2 * 60 * 1000);

    await queue.connect();

    categories.map((category) => {
      const handleCrawledProduct = async (product: ProductRecord) => {
        if (infos.total === productLimit && !queue.idle()) {
          console.log("product limit reached");
          await updateTask(taskId, { $set: { progress: task.progress } });
          await queue.disconnect(true);
          res({ infos, queueStats: queue.queueStats });
        } else {
          const transformedProduct = transformProduct(product, shopDomain);
          const {
            lnk,
            s_hash: productHash,
            nm,
            prc: buyPrice,
            qty: buyQty,
          } = transformedProduct;
          if (nm && buyPrice && lnk) {
            if (!uniqueLinks.includes(lnk)) {
              uniqueLinks.push(lnk);
              infos.total++;
              queue.total++;
              transformedProduct["qty"] = buyQty || 1;
              transformedProduct["uprc"] = roundToTwoDecimals(
                buyPrice / transformedProduct["qty"]
              );
              transformedProduct["availUpdatedAt"] =
                new UTCDate().toISOString();
              const existingProduct = await findProductByHash(productHash);
              if (existingProduct) {
                const {
                  _id: productId,
                  ean_prop, //scrape ean
                  info_prop, // scrape info
                  eby_prop, // query ean on eby
                  cat_prop, // lookup category
                } = existingProduct;
                const result = await updateArbispotterProductQuery(productId, {
                  $set: {
                    availUpdatedAt: transformedProduct["availUpdatedAt"],
                  },
                });
                log(
                  `Updating availUpdatedAt: ${salesDbName}-${productId}`,
                  result
                );
                const xDaysAgo = new UTCDate();
                xDaysAgo.setDate(
                  xDaysAgo.getDate() - RECHECK_EAN_EBY_AZN_INTERVAL
                );
                infos.old++;

                // hasEan is a flag to check if the product has an ean in the listing
                // ean is the ean that was scraped from the product link

                if (!hasEan && ean) {
                  task.progress.lookupInfo.push(productId);
                  task.progress.queryEansOnEby.push(productId);
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
                  task.progress.crawlEan.push(productId);
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
                  task.progress.lookupInfo.push(productId);
                }

                if (
                  new UTCDate(parseISO(existingProduct.createdAt)) < xDaysAgo ||
                  (ean_prop === "found" &&
                    (!eby_prop ||
                      (eby_prop !== "missing" && eby_prop !== "complete")))
                ) {
                  task.progress.queryEansOnEby.push(productId);
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
                  task.progress.lookupCategory.push(productId);
                }

                if (cat_prop === "complete" && eby_prop === "complete") {
                  task.progress.ebyListings.push(productId);
                }

                if (info_prop === "complete") {
                  task.progress.aznListings.push(productId);
                }
              } else {
                transformedProduct["sdmn"] = salesDbName;
                transformedProduct["shop"] = shopDomain;
                const result = await insertArbispotterProduct(
                  transformedProduct
                );
                log(
                  `Product inserted: ${salesDbName}-${result.insertedId}`,
                  result
                );
                if (result.acknowledged) {
                  if (result.insertedId) {
                    task.progress.crawlEan.push(result.insertedId);
                    infos.new++;
                  }
                } else {
                  infos.failedSave++;
                }
              }
            }
          } else {
            const properties: Array<
              keyof Pick<DbProductRecord, "nm" | "prc" | "lnk" | "img">
            > = ["nm", "prc", "lnk", "img"];
            properties.forEach((prop) => {
              if (!(product as DbProductRecord)[prop]) {
                infos.missingProperties[prop]++;
              }
            });
          }
        }
      };
      queue.pushTask(crawlSubpage, {
        shop,
        requestId: uuid(),
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
