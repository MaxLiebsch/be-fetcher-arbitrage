import { sub } from "date-fns";
import { addTask, deleteTask } from "../src/services/db/util/tasks.js";
import { deleteAllProducts } from "../src/services/db/util/crudCrawlDataProduct.js";
import { deleteAllArbispotterProducts } from "../src/services/db/util/crudArbispotterProduct.js";
import { LoggerService } from "@dipmaxtech/clr-pkg";
import os from "os";
import { monitorAndProcessTasks } from "../src/util/monitorAndProcessTasks.js";
import { deleteLogs } from "../src/services/db/util/logs.js";

const hostname = os.hostname();
const logger = LoggerService.getSingleton().logger;

const today = new Date();
const productLimit = 30;
const yesterday = sub(today, { days: 1 });
const shopDomain = "reichelt.de";
const crawlTask = {
  _id: "661a785dc801f69f2beb16d6",
  type: "CRAWL_SHOP",
  id: `crawl_shop_${shopDomain}_1_of_5`,
  shopDomain,
  limit: {
    mainCategory: 2,
    subCategory: 100,
    pages: 2,
  },
  categories: [
    {
      name: "Neu",
      link: "https://www.reichelt.de/?PAGE=2",
    },
    {
      name: "SALE",
      link: "https://www.reichelt.de/sale-l2568.html",
    },
  ],
  recurrent: true,
  executing: false,
  completed: false,
  errored: false,
  startedAt: yesterday.toISOString(),
  completedAt: yesterday.toISOString(),
  productLimit,
  retry: 0,
  maintenance: false,
  lastCrawler: [],
  weekday: today.getDay(),
};

const matchTask = {
  _id: "66262c7ea4877eab871802b6",
  type: "MATCH_PRODUCTS",
  id: `match_products_${shopDomain}`,
  shopDomain,
  productLimit,
  executing: true,
  maintenance: false,
  recurrent: true,
  completed: false,
  errored: false,
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

const lookupTask = {
  _id: "6638a7ec547aabce6f1708cc",
  type: "LOOKUP_PRODUCTS",
  id: `lookup_products_${shopDomain}`,
  shopDomain,
  productLimit,
  executing: false,
  lastCrawler: [],
  test: false,
  maintenance: false,
  recurrent: true,
  completed: false,
  errored: false,
  startedAt: yesterday.toISOString(),
  completedAt: yesterday.toISOString(),
  limit: {
    mainCategory: 0,
    subCategory: 0,
    pages: 0,
  },
  retry: 0,
  concurrency: 4,
};

const tasks = [crawlTask, matchTask, lookupTask];

const main = async () => {
  //empty tasks
  await Promise.all(tasks.map(async (task) => await deleteTask(task._id)));
  //empty tasks
  await deleteLogs();

  //empty DBs
  await deleteAllProducts(shopDomain);
  await deleteAllArbispotterProducts(shopDomain);
  //create Tasks
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
