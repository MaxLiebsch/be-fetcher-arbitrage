import {
  CrawlerQueue,
  crawlShop,
  crawlSubpage,
  DbProductRecord,
  ProductRecord,
  roundToTwoDecimals,
  transformProduct,
  uuid,
} from '@dipmaxtech/clr-pkg';
import { getShop } from '../db/util/shops.js';
import {
  CONCURRENCY,
  DEFAULT_CRAWL_CHECK_PROGRESS_INTERVAL,
  proxyAuth,
} from '../constants.js';
import { checkProgress } from '../util/checkProgress.js';
import {
  updateMatchProgress,
  updateProgressInCrawlEanTask,
} from '../util/updateProgressInTasks.js';
import { upsertProduct } from '../db/util/upsertProduct.js';
import { ScrapeShopStats } from '../types/taskStats/ScrapeShopStats.js';
import { ScrapeShopTask } from '../types/tasks/Tasks.js';
import { TaskCompletedStatus } from '../status.js';
import { TaskReturnType } from '../types/TaskReturnType.js';
import { MissingShopError } from '../errors.js';
import { log } from '../util/logger.js';
import { updateTask } from '../db/util/tasks.js';

async function scrapeShop(task: ScrapeShopTask): TaskReturnType {
  return new Promise(async (resolve, reject) => {
    const {
      shopDomain,
      productLimit,
      limit,
      recurrent,
      _id: taskId,
      categories,
      concurrency,
    } = task;
    log(`Scrape categories ${shopDomain}`);

    const shop = await getShop(shopDomain);
    // Reset lastTotal to 0
    await updateTask(taskId, {
      $set: {
        lastTotal: 0,
      },
    });

    if (shop === null) {
      return reject(new MissingShopError(`Shop ${shopDomain} not found`, task));
    }

    const { entryPoints, proxyType, hasEan } = shop;
    const uniqueLinks: string[] = [];

    let infos: ScrapeShopStats = {
      new: 0,
      old: 0,
      total: 0,
      elapsedTime: '',
      locked: productLimit,
      failedSave: 0,
      categoriesHeuristic: {
        subCategories: {
          0: 0,
          '1-9': 0,
          '10-19': 0,
          '20-29': 0,
          '30-39': 0,
          '40-49': 0,
          '+50': 0,
        },
        mainCategories: 0,
      },
      productPageCountHeuristic: {
        0: 0,
        '1-9': 0,
        '10-49': 0,
        '+50': 0,
      },
      missingProperties: {
        nm: 0,
        prc: 0,
        lnk: 0,
        img: 0,
      },
      notFound: 0,
    };

    log(`Product limit: ${productLimit}`);
    const queue = new CrawlerQueue(
      concurrency ? concurrency : CONCURRENCY,
      proxyAuth,
      task
    );
    queue.actualProductLimit = productLimit;

    const interval = setInterval(
      async () => await isCompleted(),
      DEFAULT_CRAWL_CHECK_PROGRESS_INTERVAL
    );

    let completed = false;
    let cnt = 0;

    const isCompleted = async () => {
      const check = await checkProgress({
        task,
        queue,
        infos,
        startTime,
        productLimit,
      });
      if (check instanceof TaskCompletedStatus && !completed) {
        completed = true;
        clearInterval(interval);
        log(`Task completed with ${uniqueLinks.length} products.`);
        await updateProgressInCrawlEanTask();
        await updateMatchProgress(shopDomain, hasEan);
        resolve(check);
      } else if (check !== undefined && completed) {
        cnt++;
        log(`Task already completed ${completed} ${cnt}`);
      }
    };

    await queue.connect();
    const startTime = Date.now();
    const addProduct = async (product: ProductRecord) => {
      const transformedProduct = transformProduct(product, shopDomain);
      const { lnk, nm, prc, qty } = transformedProduct;
      if (nm && prc && lnk) {
        if (!uniqueLinks.includes(lnk)) {
          uniqueLinks.push(lnk);
          infos.total++;
          queue.total++;
          transformedProduct['qty'] = qty || 1;
          transformedProduct['uprc'] = roundToTwoDecimals(
            prc / transformedProduct['qty']
          );
          transformedProduct['sdmn'] = shopDomain;
          const result = await upsertProduct(transformedProduct);

          log(`Saved: ${shopDomain}-${transformedProduct.s_hash}`, result);
          if (result?.acknowledged) {
            if ('insertedId' in result) infos.new++;
            else infos.old++;
          } else {
            infos.failedSave++;
          }
          if (infos.total >= productLimit) {
            await isCompleted();
          }
        }
      } else {
        const properties: Array<
          keyof Pick<DbProductRecord, 'nm' | 'prc' | 'lnk' | 'img'>
        > = ['nm', 'prc', 'lnk', 'img'];

        properties.forEach((prop) => {
          if (!transformedProduct[prop]) {
            infos.missingProperties[prop]++;
          }
        });
      }
    };

    if (recurrent) {
      categories.map((category) => {
        queue.pushTask(crawlSubpage, {
          requestId: uuid(),
          shop,
          addProduct,
          proxyType,
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
      const link = entryPoints[0].url;
      queue.pushTask(crawlShop, {
        requestId: uuid(),
        shop,
        addProduct,
        categoriesHeuristic: infos.categoriesHeuristic,
        productPageCountHeuristic: infos.productPageCountHeuristic,
        limit,
        proxyType,
        queue,
        retries: 0,
        prio: 0,
        pageInfo: {
          entryCategory: shopDomain,
          link,
          name: shopDomain.split('.')[0],
        },
      });
    }
  });
}

export default scrapeShop;
