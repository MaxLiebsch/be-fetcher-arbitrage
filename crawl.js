import {
  CrawlerQueue,
  crawlShop,
  StatService,
  crawlSubpage,
  sleep,
} from "@dipmaxtech/clr-pkg";
import {
  createCollection,
  getShops,
  upsertCrawledProduct,
  upsertSiteMap,
} from "./mongo.js";
import { TaskCompletedStatus, TimeLimitReachedStatus } from "./status.js";
import { handleResult } from "./handleResult.js";
import { MissingShopError } from "./errors.js";

const proxyAuth = {
  host: "127.0.0.1:8080",
  username: "",
  password: "",
};

const CRAWL_TIME_LIMIT = 480;
let PRODUCT_LIMIT = 10000;
const CONCURRENCY = 4;

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
    let crawledPages = 0;

    if (shops === null) reject(new MissingShopError("", task));

    await createCollection(`${shopDomain}.products`);

    if (productLimit > 0) {
      PRODUCT_LIMIT = productLimit;
    }
    const onlyCrawlCategories = taskType === "SCAN_SHOP" ? true : false;

    const products = [];

    const statService = StatService.getSingleton(shopDomain);
    const queue = new CrawlerQueue(
      task?.concurrency ? task.concurrency : CONCURRENCY,
      proxyAuth,
      task
    );
    await queue.connect();

    const startTime = Date.now();

    const interval = setInterval(
      async () =>
        await checkProcess().catch((r) => {
          clearInterval(interval);
          handleResult(r, res, reject);
        }),
      20000
    );

    const checkProcess = async () => {
      if (queue.workload() > crawledPages) {
        crawledPages = queue.workload();
      }
      if (onlyCrawlCategories) {
        await upsertSiteMap(shopDomain, statService.getStatsFile());
      }
      const endTime = Date.now();
      const elapsedTime = (endTime - startTime) / 1000 / 60 / 60;
      const progress = {
        products_cnt: products.length,
        endTime: new Date().toISOString(),
        elapsedTime: `${elapsedTime.toFixed(2)} h`,
        crawledPages,
      };
      if (products.length >= PRODUCT_LIMIT) {
        clearInterval(interval);
        await sleep(35000);
        await queue.clearQueue();
        throw new TaskCompletedStatus("PRODUCT_LIMIT_REACHED", task, progress); 
      }
      if (elapsedTime > CRAWL_TIME_LIMIT) {
        clearInterval(interval);
        await sleep(35000);
        await queue.clearQueue();
        throw new TimeLimitReachedStatus("", task, progress);
      }

      if (queue.workload() === 0) {
        clearInterval(interval);
        await sleep(35000);
        await queue.clearQueue();
        throw new TaskCompletedStatus("", task, progress);
      }
    };

    const addProduct = async (product) => {
      const found = products.find((_product) => _product.link === product.link);
      if (!found) {
        if (product.name) {
          await upsertCrawledProduct(shopDomain, {
            ...product,
            locked: false,
            matched: false,
          });
          products.push(product);
        }
      }
    };
    const link = shops[shopDomain].entryPoint.length
      ? shops[shopDomain].entryPoint[0].url
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
          onlyCrawlCategories,
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
        onlyCrawlCategories,
        pageInfo: {
          entryCategory: shopDomain,
          link,
          name: shopDomain.split(".")[0],
        },
      });
    }
  });
}
