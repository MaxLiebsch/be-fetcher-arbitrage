import { sub } from "date-fns";
import {
  addTask,
  deleteTasks,
  findTasks,
} from "../src/services/db/util/tasks.js";
import { deleteAllProducts } from "../src/services/db/util/crudCrawlDataProduct.js";
import { deleteAllArbispotterProducts } from "../src/services/db/util/crudArbispotterProduct.js";
import { LoggerService } from "@dipmaxtech/clr-pkg";
import os from "os";
import { monitorAndProcessTasks } from "../src/util/monitorAndProcessTasks.js";
import { deleteLogs } from "../src/services/db/util/logs.js";
import { getAllShops, updateShopStats } from "../src/services/db/util/shops.js";
import { shuffle } from "underscore";

const hostname = os.hostname();
const logger = LoggerService.getSingleton().logger;

const today = new Date();
const productLimit = 30;
const lookupsProductLimit = 50;
const yesterday = sub(today, { days: 1 });
const proxyType = "mix";
const timezones = ["Europe/Berlin"];
const shopDomain = "gamestop.de";

const createCrawlTask = (shopDomain, categories, proxyType) => {
  const task = {
    type: "CRAWL_SHOP",
    id: `crawl_shop_${shopDomain}_1_of_5`,
    shopDomain,
    limit: {
      mainCategory: 2,
      subCategory: 100,
      pages: 2,
    },
    categories,
    recurrent: true,
    executing: false,
    completed: false,
    startedAt: yesterday.toISOString(),
    completedAt: yesterday.toISOString(),
    productLimit,
    retry: 0,
    maintenance: false,
    lastCrawler: [],
    weekday: today.getDay(),
  };
  if (proxyType === "de") {
    task["proxyType"] = proxyType;
    task["timezones"] = timezones;
  }
  return task;
};

const createMatchTask = (shopDomain) => {
  return {
    type: "MATCH_PRODUCTS",
    id: `match_products_${shopDomain}`,
    shopDomain,
    productLimit,
    executing: true,
    maintenance: false,
    recurrent: true,
    completed: false,
    startedAt: yesterday.toISOString(),
    completedAt: yesterday.toISOString(),
    limit: {
      mainCategory: 0,
      subCategory: 0,
      pages: 0,
    },
    test: false,
    extendedLookUp: true,
    startShops: [
      {
        d: "idealo.de",
        prefix: "i_",
        name: "Idealo",
      },
    ],
    lastCrawler: [],
    concurrency: 4,
    retry: 0,
  };
};

const lookupInfoTask = {
  type: "LOOKUP_INFO",
  id: `lookup_info`,
  proxyType: "mix",
  productLimit: lookupsProductLimit,
  executing: false,
  lastCrawler: [],
  test: false,
  maintenance: false,
  recurrent: true,
  concurrency: 1,
  browserConcurrency: 4,
  completed: false,
  startedAt: yesterday.toISOString(),
  completedAt: yesterday.toISOString(),
  createdAt: "2024-05-06T07:10:51.942Z",
  limit: {
    mainCategory: 0,
    subCategory: 0,
    pages: 0,
  },
};

const crawlEanTask = {
  type: "CRAWL_EAN",
  id: `crawl_ean`,
  proxyType: "mix",
  productLimit: lookupsProductLimit,
  executing: false,
  lastCrawler: [],
  test: false,
  maintenance: false,
  concurreny: 4,
  recurrent: true,
  completed: false,
  completedAt: "",
  startedAt: "",
  createdAt: "2024-06-18T07:10:51.942Z",
  limit: {
    mainCategory: 0,
    subCategory: 0,
    pages: 0,
  },
};

const lookupCategory = {
  type: "LOOKUP_CATEGORY",
  id: `lookup_category`,
  proxyType: "mix",
  productLimit: lookupsProductLimit,
  executing: false,
  lastCrawler: [],
  test: false,
  maintenance: false,
  concurreny: 6,
  recurrent: true,
  completed: false,
  completedAt: "",
  createdAt: "2024-06-18T07:10:51.942Z",
  limit: {
    mainCategory: 0,
    subCategory: 0,
    pages: 0,
  },
};

const createCrawlAznListingsTask = (shopDomain) => {
  return {
    type: "CRAWL_AZN_LISTINGS",
    id: `crawl_azn_listings_${shopDomain}`,
    shopDomain,
    productLimit: lookupsProductLimit,
    executing: false,
    lastCrawler: [],
    test: false,
    maintenance: false,
    recurrent: true,
    completed: false,
    startedAt: "",
    createdAt: "",
    completedAt: "",
    limit: {
      mainCategory: 0,
      subCategory: 0,
      pages: 0,
    },
    retry: 0,
    concurrency: 4,
  };
};
const queryEansOnEbyTask = {
  type: "QUERY_EANS_EBY",
  id: `query_eans_eby`,
  proxyType: "mix",
  productLimit: lookupsProductLimit,
  executing: false,
  lastCrawler: [],
  test: false,
  maintenance: false,
  concurreny: 4,
  recurrent: true,
  completed: false,
  completedAt: "",
  createdAt: "2024-06-18T07:10:51.942Z",
  limit: {
    mainCategory: 0,
    subCategory: 0,
    pages: 0,
  },
};
export const createCrawlEbyListingsTask = (
  shopDomain,
  limit = lookupsProductLimit
) => {
  return {
    type: "CRAWL_EBY_LISTINGS",
    id: `crawl_eby_listings_${shopDomain}`,
    shopDomain,
    productLimit: limit,
    executing: false,
    lastCrawler: [],
    test: false,
    maintenance: false,
    recurrent: true,
    completed: false,
    startedAt: "",
    createdAt: "",
    completedAt: "",
    limit: {
      mainCategory: 0,
      subCategory: 0,
      pages: 0,
    },
    retry: 0,
    concurrency: 4,
  };
};

const tasks = [
  lookupInfoTask,
  crawlEanTask,
  lookupCategory,
  queryEansOnEbyTask,
];

const shopsToTest = [
  "alternate.de",
  "dm.de",
  "fressnapf.de",
  "cyberport.de",
  "idealo.de",
  "alza.de",
];

const main = async () => {
  const allTasks = await findTasks({}, true);
  const shops = await getAllShops();
  await Promise.all(
    shops.map(async ({ d }) => {
      //empty DBs
      return Promise.all([
        deleteAllProducts(d),
        deleteAllArbispotterProducts(d),
        updateShopStats(d),
      ]);
    })
  );
  const selectedShops = shops.filter((shop) => shopsToTest.includes(shop.d));

  //empty tasks
  await deleteTasks();

  selectedShops.forEach((shop) => {
    const crawlTask = shuffle(allTasks).find(
      (task) => task.type === "CRAWL_SHOP" && task.shopDomain === shop.d
    );
    const matchTask = allTasks.find(
      (task) => task.type === "MATCH_PRODUCTS" && task.shopDomain === shop.d
    );
    const crawlAznListingsTask = createCrawlAznListingsTask(shop.d);
    const crawlEbyListingsTask = createCrawlEbyListingsTask(shop.d);
    tasks.push(
      {
        ...crawlTask,
        productLimit,
        weekday: today.getDay(),
        maintenance: false,
        startedAt: yesterday.toISOString(),
        completedAt: yesterday.toISOString(),
      },
      crawlAznListingsTask,
      crawlEbyListingsTask
    );
    if (!shop.hasEan && !shop.ean) {
      tasks.push({
        ...matchTask,
        productLimit,
        startedAt: yesterday.toISOString(),
        completedAt: yesterday.toISOString(),
        maintenance: false,
      });
    }
  });

  //empty tasks
  await deleteLogs();

  // create Tasks
  const tasksCreated = await Promise.all(
    tasks.map(async (task) => await addTask(task))
  );

  if (tasksCreated) {
    monitorAndProcessTasks()
      .then()
      .catch((e) => {
        logger.info(`Error: Queue failed on ${hostname} error: ${e}`);
        sendMail({
          subject: `Error: Queue failed on ${hostname}`,
          html: e,
        }).then();
      });
  }
};

main().then();

const errorHandler = (err, origin) => {
  const IsTargetError = `${err}`.includes("Target closed");
  const IsSessionError = `${err}`.includes("Session closed");
  const IsNavigationDetachedError = `${err}`.includes(
    "Navigating frame was detached"
  );

  const metaData = {
    reason: err?.stack || err,
    origin,
  };
  let type = "unhandledException";
  if (IsTargetError) {
    type = "TargetClosed";
  } else if (IsSessionError) {
    type = "SessionClosed";
  } else if (IsNavigationDetachedError) {
    type = "NavigationDetached";
  }
  logger.info({
    type,
    hostname,
    taskId: "errorHandler",
    created: new Date().toISOString(),
    ...metaData,
  });

  if (type === "unhandledException") {
    throw err; //unhandledException:  Re-throw all other errors
  } else {
    return;
  }
};
process.on("unhandledRejection", errorHandler);

process.on("uncaughtException", errorHandler);
