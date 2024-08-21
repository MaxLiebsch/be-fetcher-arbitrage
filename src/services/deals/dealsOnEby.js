import { getShop } from "../db/util/shops.js";
import { crawlEbyListings } from "../../util/productPriceComperator/crawlEbyListings.js";
import { TaskCompletedStatus } from "../../status.js";

import { LoggerService } from "@dipmaxtech/clr-pkg";
import { getElapsedTime } from "../../util/dates.js";
import { scrapeProductInfo } from "../../util/productPriceComperator/scrapeProductInfo.js";
import { lookForOutdatedDealsOnEby } from "../db/util/deals/eby/lookForOutdatedDealsOnEby.js";

const logService = LoggerService.getSingleton();

export const dealsOnEby = async (task) => {
  const processStartTime = Date.now();
  const { productLimit } = task;
  const { proxyType, _id, action } = task;
  return new Promise(async (res, rej) => {
    const { products } = await lookForOutdatedDealsOnEby(
      _id,
      proxyType,
      action,
      productLimit
    );
    const ebay = await getShop("ebay.de");

    const infos = {
      scrapeProducts: {
        elapsedTime: "",
      },
      ebyListings: {
        elapsedTime: "",
      },
    };

    let stepStartTime = Date.now();
    if (products.length > 0) {
      
      const scrapeProductInfoSummary = await scrapeProductInfo(task, products);
      console.log("scrapeProductInfoSummary:", scrapeProductInfoSummary);
      infos["scrapeProducts"] = scrapeProductInfoSummary;
    }
    infos.scrapeProducts["elapsedTime"] =
      getElapsedTime(stepStartTime).elapsedTimeStr;

    if (task.progress.ebyListings.length > 0) {
      console.log(
        "Checking progress... ",
        "\nEBYLISTINGS: ",
        task.progress.ebyListings.length
      );
      console.log("Task EbyListings ", task.progress.ebyListings.length);
      if (products.length) {
        task.ebyListings = products.map(
          (shopAndProduct) => shopAndProduct.product
        );
        task.browserConfig.crawlEbyListings.productLimit = products.length;
        const crawlEbyListingsInfo = await crawlEbyListings(ebay, task);
        infos["ebyListings"] = crawlEbyListingsInfo;
      }
    }
    infos.ebyListings["elapsedTime"] =
      getElapsedTime(stepStartTime).elapsedTimeStr;

    task.statistics = task.browserConfig;
    const { elapsedTime, elapsedTimeStr } = getElapsedTime(processStartTime);

    logService.logger.info({
      shopDomain: task.shopDomain,
      taskid: task.id ?? "",
      type: task.type,
      ...infos,
      ...task.statistics,
      elapsedTime: elapsedTimeStr,
    });
    res(
      new TaskCompletedStatus("", task, {
        infos,
        statistics: task.statistics,
      })
    );
  });
};
