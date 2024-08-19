import {
  CrawlerQueue,
  crawlShop,
  crawlSubpage,
  globalEventEmitter,
  roundToTwoDecimals,
} from "@dipmaxtech/clr-pkg";
import { createCrawlDataCollection } from "./db/mongo.js";
import { handleResult } from "../handleResult.js";
import { MissingShopError } from "../errors.js";
import { getShops } from "./db/util/shops.js";
import {
  CONCURRENCY,
  DEFAULT_CRAWL_CHECK_PROGRESS_INTERVAL,
  proxyAuth,
} from "../constants.js";
import { checkProgress } from "../util/checkProgress.js";
import { createOrUpdateCrawlDataProduct } from "./db/util/createOrUpdateCrawlDataProduct.js";
import {
  updateMatchProgress,
  updateProgressInCrawlEanTask,
} from "../util/updateProgressInTasks.js";

export default async function crawl(task) {
  return new Promise(async (res, reject) => {
    const { shopDomain, productLimit, limit, recurrent, categories } = task;

    const shops = await getShops([{ d: shopDomain }]);
    let done = false;
    const shop = shops[shopDomain];
    const { entryPoints } = shop;
    const uniqueLinks = [];

    let infos = {
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
        name: 0,
        price: 0,
        link: 0,
        image: 0,
      },
    };

    if (shops === null) reject(new MissingShopError("", task));
    task.actualProductLimit = productLimit;
    const queue = new CrawlerQueue(
      task?.concurrency ? task.concurrency : CONCURRENCY,
      proxyAuth,
      task
    );
    const emitter = globalEventEmitter;

    emitter.on(`${queue.queueId}-finished`, async () => {
      await checkProgress({
        queue,
        infos,
        startTime,
        productLimit,
      }).catch(async (r) => {
        clearInterval(interval);
        await updateProgressInCrawlEanTask(shop.proxyType);
        await updateMatchProgress(shopDomain, shop.hasEan);
        handleResult(r, res, reject);
      });
    });

    await queue.connect();

    await createCrawlDataCollection(`${shopDomain}`);

    const startTime = Date.now();

    const interval = setInterval(
      async () =>
        await checkProgress({
          queue,
          infos,
          startTime,
          productLimit,
        }).catch(async (r) => {
          clearInterval(interval);
          await updateProgressInCrawlEanTask(shop.proxyType);
          await updateMatchProgress(shopDomain, shop.hasEan);
          handleResult(r, res, reject);
        }),
      DEFAULT_CRAWL_CHECK_PROGRESS_INTERVAL
    );
    const addProduct = async (product) => {
      if (done) return;
      if (infos.total === productLimit && !queue.idle()) {
        done = true;
        return;
      }
      if (product.name && product.price && product.link) {
        if (!uniqueLinks.includes(product.link)) {
          uniqueLinks.push(product.link);
          infos.total++;
          queue.total++;
          const qty = product?.qty || 1;
          if (qty) {
            product["qty"] = qty;
            product["uprc"] = roundToTwoDecimals(product.price / qty);
          } else {
            product["qty"] = 1;
            product["uprc"] = product.price;
          }
          const result = await createOrUpdateCrawlDataProduct(shopDomain, {
            ...product,
          });
          if (result.acknowledged) {
            if (result.upsertedId) infos.new++;
            else infos.old++;
          } else {
            infos.failedSave++;
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
    };
    const link = entryPoints.length
      ? entryPoints[0].url
      : "https://www." + shopDomain;

    if (recurrent) {
      categories.map((category) => {
        queue.pushTask(crawlSubpage, {
          shop,
          addProduct,
          categoriesHeuristic: infos.categoriesHeuristic,
          productPageCountHeuristic: infos.productPageCountHeuristic,
          limit,
          queue,
          retries: 0,
          prio: 0,
          pageInfo: {
            entryCategory: category.name,
            link: category.link,
            name: category.name,
          },
        });
      });
    } else {
      queue.pushTask(crawlShop, {
        shop,
        addProduct,
        categoriesHeuristic: infos.categoriesHeuristic,
        productPageCountHeuristic: infos.productPageCountHeuristic,
        limit,
        queue,
        retries: 0,
        prio: 0,
        pageInfo: {
          entryCategory: shopDomain,
          link,
          name: shopDomain.split(".")[0],
        },
      });
    }
  });
}
