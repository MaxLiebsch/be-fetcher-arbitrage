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
import {
  updateMatchProgress,
  updateProgressInCrawlEanTask,
} from "../util/updateProgressInTasks.js";
import { transformProduct } from "../util/transformProduct.js";
import { createOrUpdateArbispotterProduct } from "./db/util/createOrUpdateArbispotterProduct.js";

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
      const transformedProduct = transformProduct(product);
      const { lnk, nm, prc } = transformedProduct;
      if (nm && prc && lnk) {
        if (!uniqueLinks.includes(lnk)) {
          uniqueLinks.push(lnk);
          infos.total++;
          queue.total++;
          transformedProduct["qty"] = 1;
          transformedProduct["uprc"] = prc;
          const result = await createOrUpdateArbispotterProduct(
            shopDomain,
            transformedProduct
          );
          if (result.acknowledged) {
            if (result.upsertedId) infos.new++;
            else infos.old++;
          } else {
            infos.failedSave++;
          }
        }
      } else {
        const properties = ["nm", "prc", "lnk", "img"];
        properties.forEach((prop) => {
          if (!transformedProduct[prop]) {
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
