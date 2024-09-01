import {
  ScanQueue,
  scanShop,
  StatService,
  uuid,
} from "@dipmaxtech/clr-pkg";
import { upsertSiteMap } from "./db/mongo.js";
import { handleResult } from "../handleResult.js";
import { MissingShopError } from "../errors.js";
import { getShops } from "./db/util/shops.js";
import {
  CONCURRENCY,
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  proxyAuth,
} from "../constants.js";
import { checkProgress } from "../util/checkProgress.js";

export default async function scan(task) {
  return new Promise(async (res, reject) => {
    const { shopDomain, productLimit } = task;
    const shops = await getShops([{ d: shopDomain }]);

    let infos = {
      new: 0,
      old: 0,
      total: 1,
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

    const queue = new ScanQueue(
      task?.concurrency ? task.concurrency : CONCURRENCY,
      proxyAuth,
      task
    );
    await queue.connect();

    const statService = StatService.getSingleton(shopDomain);

    const startTime = Date.now();

    const interval = setInterval(
      async () =>
        await checkProgress({ queue, infos, startTime, productLimit }).catch(
          async (r) => {
            await upsertSiteMap(shopDomain, statService.getStatsFile());
            clearInterval(interval);
          
            handleResult(r, res, reject);
          }
        ),
      DEFAULT_CHECK_PROGRESS_INTERVAL
    );

    const link = shops[shopDomain].entryPoints.length
      ? shops[shopDomain].entryPoints[0].url
      : "https://www." + shopDomain;

    queue.pushTask(scanShop, {
      parentPath: "sitemap",
      requestId: uuid(),
      shop: shops[shopDomain],
      infos,
      categoriesHeuristic: infos.categoriesHeuristic,
      productPageCountHeuristic: infos.productPageCountHeuristic,
      queue,
      retries: 0,
      prio: 0,
      pageInfo: {
        entryCategory: shopDomain,
        link,
        name: shopDomain.split(".")[0],
      },
    });
  });
}
