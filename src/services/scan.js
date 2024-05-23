import {
  CrawlerQueue,
  crawlShop,
  StatService,
} from "@dipmaxtech/clr-pkg";
import {  upsertSiteMap } from "./db/mongo.js";
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

export default async function scan(task) {
  return new Promise(async (res, reject) => {
    const {
      shopDomain,
      productLimit,
      limit,
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

    const statService = StatService.getSingleton(shopDomain);

    const startTime = Date.now();

    const interval = setInterval(
      async () =>
        await checkProgress({ queue, done, startTime, productLimit }).catch(
          async (r) => {
            await upsertSiteMap(shopDomain, statService.getStatsFile());
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
            await upsertSiteMap(shopDomain, statService.getStatsFile());
            clearInterval(interval);
            handleResult(r, res, reject);
          }
        );
      } else {
        if (product.name) {
          done++;
          await upsertCrawledProduct(shopDomain, {
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

    queue.pushTask(crawlShop, {
      parent: null,
      parentPath: "",
      shop: shops[shopDomain],
      addProduct,
      limit,
      queue,
      retries: 0,
      prio: 0,
      onlyCrawlCategories: true,
      pageInfo: {
        entryCategory: shopDomain,
        link,
        name: shopDomain.split(".")[0],
      },
    });
  });
}
