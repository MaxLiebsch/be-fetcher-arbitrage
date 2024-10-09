import { LocalLogger, ObjectId } from "@dipmaxtech/clr-pkg";
import { dailySales } from "../../src/services/dailySales";
import { DailySalesTask } from "../../src/types/tasks/DailySalesTask";
import { setTaskLogger } from "../../src/util/logger";
import { describe, test } from "@jest/globals";
import { deleteAllProducts } from "../../src/db/util/crudProducts";

const shopDomain = "mindfactory.de";
const task = {
  _id: new ObjectId("66b9b8d3e1eb3dcedd11e0eb"),
  type: "DAILY_SALES",
  proxyType: "de",
  id: "daily_sales_" + shopDomain,
  shopDomain,
  executing: false,
  productLimit: 200,
  lastCrawler: [],
  categories: [
    {
      "name": "Sales",
      "link": "https://www.mindfactory.de/DAMN"
    },
    {
      "name": "Sales",
      "link": "https://www.mindfactory.de/SchnaeppShop.html"
    }
  ],
  test: false,
  maintenance: false,
  recurrent: true,
  completed: false,
  errored: false,
  startedAt: "2024-08-13T13:39:38.584Z",
  completedAt: "",
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
        pages: 23,
        subCategory: 100,
        mainCategory: 20,
      },
    },
    crawlEan: {
      productLimit: 20,
      concurrency: 4,
    },
    lookupInfo: {
      concurrency: 1,
      productLimit: 20,
      browserConcurrency: 4,
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
      concurrency: 4,
      productLimit: 20,
    },
    crawlEbyListings: {
      concurrency: 4,
      productLimit: 20,
    },
  },
  retry: 0,
};

describe("Daily Sales", () => {
  beforeAll(async () => {
    await deleteAllProducts("sales");
  }, 100000);

  test("Daily Sales listings", async () => {
    const logger = new LocalLogger().createLogger("DAILY_SALES");
    setTaskLogger(logger, "TASK_LOGGER");

    const infos = await dailySales(task as unknown as DailySalesTask);
    console.log(JSON.stringify(infos, null, 2));
  }, 1000000);
});
