import { findShops } from "./db/util/shops.js";
import {
  createArbispotterCollection,
  createCrawlDataCollection,
  hostname,
} from "./db/mongo.js";
import { ObjectId } from "mongodb";
import { crawlProducts } from "../util/productPriceComperator/crawlProducts.js";
import { crawlEans } from "../util/productPriceComperator/crawlEan.js";
import { lookupInfo } from "../util/productPriceComperator/lookupInfo.js";
import { queryEansOnEby } from "../util/productPriceComperator/queryEansOnEby.js";
import { lookupCategory } from "../util/productPriceComperator/lookupCategory.js";
import { crawlAznListings } from "../util/productPriceComperator/crawlAznListings.js";
import { crawlEbyListings } from "../util/productPriceComperator/crawlEbyListings.js";
import { findCrawlDataProductsNoLimit } from "./db/util/crudCrawlDataProduct.js";
import { TaskCompletedStatus } from "../status.js";
import isTaskComplete from "../util/isTaskComplete.js";

let task = {
  _id: new ObjectId("66b30a822cfd0e4c93aba609"),
  type: "DAILY_SALES",
  id: "daily_sales_idealo.de",
  shopDomain: "idealo.de",
  recurrent: true,
  productLimit: 20,
  executing: false,
  createdAt: "2024-04-13T12:20:47.258Z",
  errored: false,
  startedAt: "2024-08-03T00:00:07.852Z",
  completedAt: "2024-08-03T00:30:09.826Z",
  retry: 0,
  maintenance: false,
  lastCrawler: [],
  visitedPages: [],
  categories: [
    {
      name: "Sale",
      link: "https://www.idealo.de/preisvergleich/MainSearchProductCategory/100oE0oJ4.html",
      productLimit: 20,
    },
  ],
  progress: {
    crawlEan: [],
    lookupInfo: [],
    lookupCategory: [],
    queryEansOnEby: [],
    aznListings: [],
    ebyListings: [],
  },
  browserConfig: {
    crawlShop: {
      concurrency: 4,
      limit: {
        subCategory: 100,
        pages: 10,
      },
    },
    crawlEan: {
      productLimit: 20,
      concurrency: 4,
    },
    lookupInfo: {
      concurrency: 1,
      productLimit: 20,
      browserConcurrency: 6,
    },
    queryEansOnEby: {
      concurrency: 4,
      productLimit: 20,
    },
    lookupCategory: {
      concurrency: 4,
      productLimit: 20,
    },
    crawlAznListings: {
      concurrency: 1,
      productLimit: 20,
      browserConcurrency: 6,
    },
    crawlEbyListings: {
      concurrency: 4,
      productLimit: 20,
    },
  },
};

export const salesDbName = "sales";


export const productPriceComperator = async (task) => {
  // task = await findTask(task._id);
  const { shopDomain } = task;
  return new Promise(async (res, rej) => {
    const shops = await findShops([
      shopDomain,
      "amazon.de",
      "sellercentral.amazon.de",
      "ebay.de",
    ]);
    const sellerCentral = shops["sellercentral.amazon.de"];
    const ebay = shops["ebay.de"];
    const origin = shops[shopDomain];

    const infos = {
      crawlProducts: {},
      crawlEan: {},
      lookupInfo: {},
      lookupCategory: {},
      queryEansOnEby: {},
      aznListings: {},
      ebyListings: {},
    };
    await createCrawlDataCollection("sales");
    await createArbispotterCollection("sales");

    if (task.action === "recover") {
      infos["total"] = task.productLimit;
    } else {
      const crawledProductsInfo = await crawlProducts(origin, task);
      infos["crawlProducts"] = crawledProductsInfo;
      infos["total"] = crawledProductsInfo.total;
    }

    if (task.progress.crawlEan.length > 0) {
      console.log("Task CrawlEan");
      const products = await findCrawlDataProductsNoLimit(salesDbName, {
        _id: { $in: task.progress.crawlEan },
      });
      if (products.length) {
        task.crawlEan = products;
        task.browserConfig.crawlEan.productLimit = products.length;
        const crawlEansInfo = await crawlEans(origin, task);
        infos["crawlEan"] = crawlEansInfo;
      }
    }

    if (task.progress.lookupInfo.length > 0) {
      console.log("Task LookupInfo");
      const products = await findCrawlDataProductsNoLimit(salesDbName, {
        _id: { $in: task.progress.lookupInfo },
      });
      if (products.length) {
        task.lookupInfo = products;
        task.browserConfig.lookupInfo.productLimit = products.length;
        const lookupInfos = await lookupInfo(sellerCentral, origin, task);
        infos["lookupInfo"] = lookupInfos;
      }
    }

    if (task.progress.queryEansOnEby.length > 0) {
      console.log("Task QueryEansOnEby");
      const products = await findCrawlDataProductsNoLimit(salesDbName, {
        _id: { $in: task.progress.queryEansOnEby },
      });
      if (products.length) {
        task.queryEansOnEby = products;
        task.browserConfig.queryEansOnEby.productLimit = products.length;
        const queryEansOnEbyInfo = await queryEansOnEby(ebay, task);
        infos["queryEansOnEby"] = queryEansOnEbyInfo;
      }
    }

    if (task.progress.lookupCategory.length > 0) {
      console.log("Task LookupCategory");
      const products = await findCrawlDataProductsNoLimit(salesDbName, {
        _id: { $in: task.progress.lookupCategory },
      });
      if (products.length) {
        task.lookupCategory = products;
        task.browserConfig.lookupCategory.productLimit = products.length;
        const lookupCategoryInfo = await lookupCategory(ebay, origin, task);
        infos["lookupCategory"] = lookupCategoryInfo;
      }
    }

    if (task.progress.aznListings.length > 0) {
      console.log("Task AznListings");
      const products = await findCrawlDataProductsNoLimit(salesDbName, {
        _id: { $in: task.progress.aznListings },
      });
      if (products.length) {
        task.aznListings = products;
        task.browserConfig.crawlAznListings.productLimit = products.length;
        const crawlAznListingsInfo = await crawlAznListings(
          sellerCentral,
          origin,
          task
        );
        infos["aznListings"] = crawlAznListingsInfo;
      }
    }

    if (task.progress.ebyListings.length > 0) {
      console.log("Task EbyListings");
      const products = await findCrawlDataProductsNoLimit(salesDbName, {
        _id: { $in: task.progress.ebyListings },
      });
      if (products.length) {
        task.ebyListings = products;
        task.browserConfig.crawlEbyListings.productLimit = products.length;
        const crawlEbyListingsInfo = await crawlEbyListings(ebay, task);
        infos["ebyListings"] = crawlEbyListingsInfo;
      }
    }
    task.statistics = task.browserConfig;
    res(
      new TaskCompletedStatus("", task, {
        infos,
        statistics: task.statistics,
      })
    );
  });
};

// productPriceComperator(task).then((r) => {
//   console.log(JSON.stringify(r, null, 2));
//   console.log(
//     "Task completed ",
//     isTaskComplete(task.type, r.result.infos, task.productLimit)
//   );
// });
