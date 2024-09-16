import {
  CrawlerQueue,
  crawlShop,
  crawlSubpage,
  DbProductRecord,
  globalEventEmitter,
  ProductRecord,
  roundToTwoDecimals,
  transformProduct,
  uuid,
} from "@dipmaxtech/clr-pkg";
import { createArbispotterCollection } from "../db/mongo";
import { getShop } from "../db/util/shops";
import {
  CONCURRENCY,
  DEFAULT_CRAWL_CHECK_PROGRESS_INTERVAL,
  proxyAuth,
} from "../constants";
import { checkProgress } from "../util/checkProgress";
import {
  updateMatchProgress,
  updateProgressInCrawlEanTask,
} from "../util/updateProgressInTasks";
import { createOrUpdateArbispotterProduct } from "../db/util/createOrUpdateArbispotterProduct";
import { ScrapeShopStats } from "../types/taskStats/ScrapeShopStats";
import { ScrapeShopTask } from "../types/tasks/Tasks";
import { TaskCompletedStatus } from "../status";
import { TaskReturnType } from "../types/TaskReturnType";
import { MissingShopError } from "../errors";
import { log } from "../util/logger";

async function scrapeShop(task: ScrapeShopTask): TaskReturnType {
  return new Promise(async (resolve, reject) => {
    const {
      shopDomain,
      productLimit,
      limit,
      recurrent,
      categories,
      concurrency,
    } = task;
    log(`Scrape categories ${shopDomain}`);

    const shop = await getShop(shopDomain);
    if (shop === null) {
      return reject(new MissingShopError(`Shop ${shopDomain} not found`, task));
    }

    let done = false;
    const { entryPoints, proxyType, hasEan } = shop;
    const uniqueLinks: string[] = [];

    let infos: ScrapeShopStats = {
      new: 0,
      old: 0,
      total: 0,
      elapsedTime: "",
      locked: productLimit,
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
      notFound: 0,
    };

    task.actualProductLimit = productLimit;
    log(`Product limit: ${productLimit}`);
    const queue = new CrawlerQueue(
      concurrency ? concurrency : CONCURRENCY,
      proxyAuth,
      task
    );
    const emitter = globalEventEmitter;

    const isCompleted = async () => {
      const check = await checkProgress({
        task,
        queue,
        infos,
        startTime,
        productLimit,
      });
      if (check instanceof TaskCompletedStatus) {
        log(`Task completed with ${uniqueLinks.length} products.`);
        clearInterval(interval);
        await updateProgressInCrawlEanTask(proxyType);
        await updateMatchProgress(shopDomain, hasEan);
        resolve(check);
      }
    };

    emitter.on(`${queue.queueId}-finished`, async () => await isCompleted());

    await queue.connect();
    await createArbispotterCollection(`${shopDomain}`);
    const startTime = Date.now();
    const interval = setInterval(
      async () => await isCompleted(),
      DEFAULT_CRAWL_CHECK_PROGRESS_INTERVAL
    );
    const addProduct = async (product: ProductRecord) => {
      if (done) return;
      if (infos.total === productLimit && !queue.idle()) {
        done = true;
        return;
      }
      const transformedProduct = transformProduct(product, shopDomain);
      const { lnk, nm, prc, qty } = transformedProduct;
      if (nm && prc && lnk) {
        if (!uniqueLinks.includes(lnk)) {
          uniqueLinks.push(lnk);
          infos.total++;
          queue.total++;
          transformedProduct["qty"] = qty || 1;
          transformedProduct["uprc"] = roundToTwoDecimals(
            prc / transformedProduct["qty"]
          );
          const result = await createOrUpdateArbispotterProduct(
            shopDomain,
            transformedProduct
          );

          log(`Saved: ${shopDomain}-${transformedProduct.s_hash}`, result);
          if (result?.acknowledged) {
            if ("insertedId" && result) infos.new++;
            else infos.old++;
          } else {
            infos.failedSave++;
          }
        }
      } else {
        const properties: Array<
          keyof Pick<DbProductRecord, "nm" | "prc" | "lnk" | "img">
        > = ["nm", "prc", "lnk", "img"];
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
          requestId: uuid(),
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
        requestId: uuid(),
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

export default scrapeShop;
