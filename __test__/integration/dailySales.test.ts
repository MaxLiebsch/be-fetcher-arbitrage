import { LocalLogger, ObjectId } from "@dipmaxtech/clr-pkg";
import { dailySales } from "../../src/services/dailySales";
import { DailySalesTask } from "../../src/types/tasks/DailySalesTask";
import { setTaskLogger } from "../../src/util/logger";
import { describe, test } from "@jest/globals";
import { deleteAllProducts } from "../../src/db/util/crudProducts";

const shopDomain = "voelkner.de";
const task = {
  _id: new ObjectId("66b9b8d3e1eb3dcedd11e0eb"),
  type: "DAILY_SALES",
  proxyType: "mix",
  id: "daily_sales_" + shopDomain,
  shopDomain,
  executing: false,
  productLimit: 50,
  lastCrawler: [],
  categories: [
    {
      name: "Sale",
      link: "https://www.voelkner.de/categories/13150_13268/Freizeit-Hobby/Sale.html",
      limit: {
        subCategories: 100,
        pages: 10,
      },
      productLimit: 20,
    },
    {
      name: "Sale",
      link: "https://www.voelkner.de/products/dailydeals.html?itm_source=info&itm_medium=deals_block&itm_campaign=goToDealsPage",
      limit: {
        subCategories: 100,
        pages: 10,
      },
      productLimit: 20,
    },
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
    setTaskLogger(logger, 'TASK_LOGGER');

    const infos = await dailySales(task as unknown as DailySalesTask);
    console.log(JSON.stringify(infos, null, 2));
  }, 1000000);
});

let task2 = {
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
      browserConcurrency: 4,
    },
    crawlEbyListings: {
      concurrency: 4,
      productLimit: 20,
    },
  },
};
