import {
  findCrawledProductByLink,
  upsertCrawlDataProduct,
} from "../../services/db/util/crudCrawlDataProduct.js";
import { updateTask } from "../../services/db/util/tasks.js";
import {
  CrawlerQueue,
  crawlSubpage,
  globalEventEmitter,
  roundToTwoDecimals,
  sleep,
} from "@dipmaxtech/clr-pkg";
import { salesDbName } from "../../services/productPriceComparator.js";
import { proxyAuth, RECHECK_EAN_EBY_AZN_INTERVAL } from "../../constants.js";
import { parseISO } from "date-fns";

export const crawlProducts = async (shop, task) =>
  new Promise(async (res, rej) => {
    const { categories, browserConfig, _id, shopDomain, productLimit } = task;
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
      console.log("Checking progress... ", task.progress.crawlEan.length);
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
          if (product.name && product.price && product.link) {
            if (!uniqueLinks.includes(product.link)) {
              uniqueLinks.push(product.link);
              infos.total++;
              queue.total++;
              const qty = 1;
              if (qty) {
                product["qty"] = qty;
                product["uprc"] = roundToTwoDecimals(product.price / qty);
              } else {
                product["qty"] = 1;
                product["uprc"] = product.price;
              }
              const existingProduct = await findCrawledProductByLink(
                salesDbName,
                product.link
              );
              if (existingProduct) {
                const xDaysAgo = new Date();
                xDaysAgo.setDate(
                  xDaysAgo.getDate() - RECHECK_EAN_EBY_AZN_INTERVAL
                );
                infos.old++;
                const {
                  ean_prop,
                  info_prop,
                  eby_prop,
                  cat_prop,
                  ebyUpdatedAt,
                  aznUpdatedAt,
                } = existingProduct;
                if (!shop.hasEan && shop.ean) {
                  task.progress.lookupInfo.push(existingProduct._id);
                  task.progress.queryEansOnEby.push(existingProduct._id);
                  return;
                }
                if (
                  !ean_prop ||
                  ean_prop !== "missing" ||
                  ean_prop !== "found"
                ) {
                  task.progress.crawlEan.push(existingProduct._id);
                  return;
                }
                if (
                  new Date(parseISO(existingProduct.createdAt)) < xDaysAgo ||
                  (ean_prop === "found" &&
                    (!info_prop ||
                      info_prop !== "missing" ||
                      info_prop !== "complete"))
                ) {
                  task.progress.lookupInfo.push(existingProduct._id);
                }

                if (
                  new Date(parseISO(existingProduct.createdAt)) < xDaysAgo ||
                  (ean_prop === "found" &&
                    (!eby_prop ||
                      eby_prop !== "missing" ||
                      eby_prop !== "complete"))
                ) {
                  task.progress.queryEansOnEby.push(existingProduct._id);
                }

                if (
                  eby_prop === "complete" &&
                  (!cat_prop ||
                    cat_prop !== "complete" ||
                    cat_prop !== "missing" ||
                    cat_prop !== "ean_missing" ||
                    cat_prop !== "ean_missmatch" ||
                    cat_prop !== "categories_missing" ||
                    cat_prop !== "category_not_found")
                ) {
                  task.progress.lookupCategory.push(existingProduct._id);
                }

                if (ebyUpdatedAt) {
                  task.progress.ebyListings.push(existingProduct._id);
                }

                if (aznUpdatedAt) {
                  task.progress.aznListings.push(existingProduct._id);
                }
              } else {
                const result = await upsertCrawlDataProduct(
                  salesDbName,
                  product
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
            const properties = ["name", "price", "link", "image"];
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
