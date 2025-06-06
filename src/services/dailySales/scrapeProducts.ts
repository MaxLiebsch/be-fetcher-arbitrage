import { updateTask } from '../../db/util/tasks.js';
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
} from '@dipmaxtech/clr-pkg';
import { parseISO } from 'date-fns';

import {
  MAX_RETRIES_DAILY_SALES,
  proxyAuth,
  RECHECK_EAN_EBY_AZN_INTERVAL,
  STANDARD_SETTLING_TIME,
} from '../../constants.js';
import {
  findProductByHash,
  insertProduct,
  updateProductWithQuery,
} from '../../db/util/crudProducts.js';
import { salesDbName } from '../../db/mongo.js';
import { DailySalesTask } from '../../types/tasks/DailySalesTask.js';
import { ScrapeShopStats } from '../../types/taskStats/ScrapeShopStats.js';
import { MultiStageReturnType } from '../../types/DailySalesReturnType.js';
import { log } from '../../util/logger.js';
import { setupAllowedDomainsBasedOnShops } from '../../util/setupAllowedDomains.js';

export const scrapeProducts = async (
  shop: Shop,
  task: DailySalesTask
): Promise<MultiStageReturnType> =>
  new Promise(async (res, rej) => {
    const { categories, browserConfig, _id: taskId, id } = task;
    task.currentStep = 'CRAWL_SHOP';
    const { d: shopDomain, hasEan, ean, proxyType } = shop;
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
      locked: 0,
      notFound: 0,
      elapsedTime: '',
    };
    const queue = new CrawlerQueue(concurrency, proxyAuth, task);
    await setupAllowedDomainsBasedOnShops([shop], task.type);
    let productLimit = task.productLimit;
    queue.actualProductLimit = productLimit;

    const eventEmitter = globalEventEmitter;

    let done = false;
    eventEmitter.on(
      `${queue.queueId}-finished`,
      async function crawlProductsCallback() {
        if (done) return;
        done = true;
        log(`Settling time for Scrape Shop ${id}...`);
        await sleep(STANDARD_SETTLING_TIME);
        console.log('FINISHED!');
        interval && clearInterval(interval);
        await updateTask(taskId, { $set: { progress: task.progress } });
        await queue.disconnect(true);
        res({ infos, queueStats: queue.queueStats });
      }
    );

    const interval = setInterval(async () => {
      if (queue.empty()) {
        await sleep(STANDARD_SETTLING_TIME);
        if (queue.empty()) {
          interval && clearInterval(interval);
          await queue.disconnect(true);
          res({ infos, queueStats: queue.queueStats });
        }
      }
    }, 2 * 60 * 1000);

    await queue.connect(shop.csp);

    let productLimitUpdated = false;
    const updateProductLimit = (limit: number) => {
      queue.actualProductLimit = limit;
      if (productLimitUpdated) {
        productLimit += limit;
      } else {
        productLimitUpdated = true;
        if (productLimit < limit) {
          productLimit = limit;
        }
      }
    };

    categories.map((category) => {
      const { skipSubCategories, scrapeCurrentPageProducts, name, link } =
        category;
      const handleCrawledProduct = async (product: ProductRecord) => {
        if (infos.total === productLimit && !queue.idle()) {
          console.log('product limit reached');
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
              transformedProduct['qty'] = buyQty || 1;
              transformedProduct['uprc'] = roundToTwoDecimals(
                buyPrice / transformedProduct['qty']
              );
              transformedProduct['availUpdatedAt'] = new Date().toISOString();
              const existingProduct = await findProductByHash(productHash);
              if (existingProduct) {
                const {
                  _id: productId,
                  ean_prop, //scrape ean
                  info_prop, // scrape info
                  eby_prop, // query ean on eby
                  cat_prop, // lookup category
                } = existingProduct;
                const result = await updateProductWithQuery(productId, {
                  $set: {
                    sdmn: salesDbName,
                    shop: shopDomain,
                    availUpdatedAt: transformedProduct['availUpdatedAt'],
                  },
                });
                log(
                  `Updating availUpdatedAt: ${salesDbName}-${productId}`,
                  result
                );
                const xDaysAgo = new Date();
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
                  (ean_prop !== 'missing' &&
                    ean_prop !== 'invalid' &&
                    ean_prop !== 'found')
                ) {
                  task.progress.crawlEan.push(productId);
                  return;
                }

                if (
                  ean_prop === 'found' &&
                  (!info_prop ||
                    (info_prop !== 'missing' &&
                      info_prop !== 'no_bsr' &&
                      info_prop !== 'no_offer' &&
                      info_prop !== 'error' &&
                      info_prop !== 'not_found' &&
                      info_prop !== 'incomplete' &&
                      info_prop !== 'complete'))
                ) {
                  task.progress.lookupInfo.push(productId);
                }

                if (
                  ean_prop === 'found' &&
                  (!eby_prop ||
                    (eby_prop !== 'missing' && eby_prop !== 'complete'))
                ) {
                  task.progress.queryEansOnEby.push(productId);
                }

                if (
                  eby_prop === 'complete' &&
                  (!cat_prop ||
                    (cat_prop !== 'complete' &&
                      cat_prop !== 'timeout' &&
                      cat_prop !== 'ean_missing' &&
                      cat_prop !== 'ean_missmatch' &&
                      cat_prop !== 'categories_missing' &&
                      cat_prop !== 'category_not_found'))
                ) {
                  task.progress.lookupCategory.push(productId);
                }

                if (cat_prop === 'complete' && eby_prop === 'complete') {
                  task.progress.ebyListings.push(productId);
                }
              } else {
                transformedProduct['sdmn'] = salesDbName;
                transformedProduct['shop'] = shopDomain;
                const result = await insertProduct(transformedProduct);
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
              keyof Pick<DbProductRecord, 'nm' | 'prc' | 'lnk' | 'img'>
            > = ['nm', 'prc', 'lnk', 'img'];
            properties.forEach((prop) => {
              if (!(product as unknown as DbProductRecord)[prop]) {
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
        proxyType,
        updateProductLimit,
        retriesOnFail: MAX_RETRIES_DAILY_SALES,
        queue: queue,
        retries: 0,
        prio: 0,
        pageInfo: {
          skipSubCategories: Boolean(skipSubCategories),
          scrapeCurrentPageProducts: Boolean(scrapeCurrentPageProducts),
          entryCategory: name,
          link,
          name,
        },
      });
    });
  });
