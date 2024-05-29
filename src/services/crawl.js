import { CrawlerQueue, crawlShop, crawlSubpage } from "@dipmaxtech/clr-pkg";
import { createCollection } from "./db/mongo.js";
import { handleResult } from "../handleResult.js";
import { MissingShopError } from "../errors.js";
import { getShops } from "./db/util/shops.js";
import {
  CONCURRENCY,
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  proxyAuth,
} from "../constants.js";
import { checkProgress } from "../util/checkProgress.js";
import { createOrUpdateCrawlDataProduct } from "./db/util/createOrUpdateCrawlDataProduct.js";

export default async function crawl(task) {
  return new Promise(async (res, reject) => {
    const { shopDomain, productLimit, limit, recurrent, categories } = task;

    const shops = await getShops([{ d: shopDomain }]);

    let infos = {
      new: 0,
      old: 0,
      total: 0,
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
        await checkProgress({
          queue,
          infos,
          startTime,
          productLimit,
        }).catch(async (r) => {
          clearInterval(interval);
          handleResult(r, res, reject);
        }),
      DEFAULT_CHECK_PROGRESS_INTERVAL
    );
    const addProduct = async (product) => {
      const infoCb = (isNewProduct) => {
        if (isNewProduct) {
          infos.new++;
        } else {
          infos.old++;
        }
      };

      if (infos.total >= productLimit && !queue.idle()) {
        await checkProgress({
          queue,
          infos,
          startTime,
          productLimit,
        }).catch(async (r) => {
          clearInterval(interval);
          handleResult(r, res, reject);
        });
      } else {
        if (product.name && product.price && product.link && product.image) {
          infos.total++;
          await createOrUpdateCrawlDataProduct(
            shopDomain,
            {
              ...product,
              locked: false,
              matched: false,
            },
            infoCb
          );
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
    const link = shops[shopDomain].entryPoints.length
      ? shops[shopDomain].entryPoints[0].url
      : "https://www." + shopDomain;

    if (recurrent) {
      categories.map((category) => {
        queue.pushTask(crawlSubpage, {
          shop: shops[shopDomain],
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
        shop: shops[shopDomain],
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
