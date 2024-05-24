import { CrawlerQueue, crawlShop, crawlSubpage } from "@dipmaxtech/clr-pkg";
import { createCollection } from "./db/mongo.js";
import { handleResult } from "../handleResult.js";
import { MissingShopError } from "../errors.js";
import { getShops } from "./db/util/shops.js";
import { upsertCrawledProduct } from "./db/util/crudCrawlDataProduct.js";
import {
  CONCURRENCY,
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  proxyAuth,
} from "../constants.js";
import { checkProgress } from "../util/checkProgress.js";
import { createOrUpdateCrawlDataProduct } from "./db/util/createOrUpdateCrawlDataProduct.js";

export default async function crawl(task) {
  return new Promise(async (res, reject) => {
    const {
      shopDomain,
      type: taskType,
      productLimit,
      limit,
      recurrent,
      categories,
    } = task;

    const shops = await getShops([{ d: shopDomain }]);
    let done = 0;

    if (shops === null) reject(new MissingShopError("", task));

    const queue = new CrawlerQueue(
      task?.concurrency ? task.concurrency : CONCURRENCY,
      proxyAuth,
      task
    );
    await queue.connect();

    await createCollection(`${shopDomain}.products`);

    const startTime = Date.now();

    const interval = setInterval(
      async () =>
        await checkProgress({ queue, done, startTime, productLimit }).catch(
          async (r) => {
            clearInterval(interval);
            handleResult(r, res, reject);
          }
        ),
      DEFAULT_CHECK_PROGRESS_INTERVAL
    );
    const addProduct = async (product) => {
      if (done >= productLimit && !queue.idle()) {
        await checkProgress({ queue, done, startTime, productLimit }).catch(
          async (r) => {
            clearInterval(interval);
            handleResult(r, res, reject);
          }
        );
      } else {
        if (product.name) {
          done++;
          await createOrUpdateCrawlDataProduct(shopDomain, {
            ...product,
            locked: false,
            matched: false,
          });
        }
      }
    };
    const link = shops[shopDomain].entryPoints.length
      ? shops[shopDomain].entryPoints[0].url
      : "https://www." + shopDomain;

    if (recurrent) {
      categories.map((category) => {
        queue.pushTask(crawlSubpage, {
          parent: null,
          parentPath: "",
          shop: shops[shopDomain],
          addProduct,
          limit,
          queue,
          retries: 0,
          prio: 0,
          onlyCrawlCategories: false,
          pageInfo: {
            entryCategory: category.name,
            link: category.link,
            name: category.name,
          },
        });
      });
    } else {
      queue.pushTask(crawlShop, {
        parent: null,
        parentPath: "",
        shop: shops[shopDomain],
        addProduct,
        limit,
        queue,
        retries: 0,
        prio: 0,
        onlyCrawlCategories: false,
        pageInfo: {
          entryCategory: shopDomain,
          link,
          name: shopDomain.split(".")[0],
        },
      });
    }
  });
}
