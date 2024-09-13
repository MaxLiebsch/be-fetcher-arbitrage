import { ScanQueue, scanShop, StatService, uuid } from "@dipmaxtech/clr-pkg";
import { upsertSiteMap } from "../db/mongo";
import { handleResult } from "../handleResult";
import { MissingShopError } from "../errors";
import { getShops } from "../db/util/shops";
import {
  CONCURRENCY,
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  proxyAuth,
} from "../constants";
import { checkProgress } from "../util/checkProgress";
import { ScanTask } from "../types/tasks/Tasks";
import { TaskCompletedStatus } from "../status";
import { ScanShopStats } from "../types/taskStats/ScanShopStats";
import { TaskReturnType } from "../types/TaskReturnType";

export default async function scan(task: ScanTask):TaskReturnType {
  return new Promise(async (res, reject) => {
    const { shopDomain, productLimit } = task;
    const shops = await getShops([{ d: shopDomain }]);

    let infos: ScanShopStats = {
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
      locked: 0,
      notFound: 0,
      elapsedTime: "",
    };

    if (shops === null) return reject(new MissingShopError("", task));

    const queue = new ScanQueue(
      task?.concurrency ? task.concurrency : CONCURRENCY,
      proxyAuth,
      task
    );
    await queue.connect();

    const statService = StatService.getSingleton(shopDomain);

    const startTime = Date.now();

    const isCompleted = async () => {
      const check = await checkProgress({
        task,
        queue,
        infos,
        startTime,
        productLimit,
      });
      if (check instanceof TaskCompletedStatus) {
        await upsertSiteMap(shopDomain, statService.getStatsFile());
        clearInterval(interval);
        handleResult(check, res, reject);
      }
    };

    const interval = setInterval(
      async () => await isCompleted(),
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
