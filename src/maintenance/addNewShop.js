import { updateShopWithQuery } from "../db/util/shops.js";
import { findTasks } from "../db/util/tasks.js";
import {
  createCrawlAznListingsTask,
  createCrawlEbyListingsTask,
  createCrawlTasks,
  createDailySalesTask,
  createSingleCrawlAznListingsTask,
  createSingleMatchTask,
} from "../task.js";
import { distributeCrawlTasksToDays } from "./distributeCrawlTasksToDays.js";

const newShops = [
  {
    d: "alza.de",
    gb: false,
    maxProducts: 20000,
    productLimit: 500,
    salesProductLimit: 2000,
    hasEan: true,
    proxyType: "mix",
    categories: [],
  },
];

const initStatsPerDay = {
  0: {
    total: 0,
    ids: [],
  },
  1: {
    total: 0,
    ids: [],
  },
  2: {
    total: 0,
    ids: [],
  },
  3: {
    total: 0,
    ids: [],
  },
  4: {
    total: 0,
    ids: [],
  },
  5: {
    total: 0,
    ids: [],
  },
  6: {
    total: 0,
    ids: [],
  },
};

const statsPerDay = {
  0: {
    total: 0,
    ids: [],
  },
  1: {
    total: 0,
    ids: [],
  },
  2: {
    total: 0,
    ids: [],
  },
  3: {
    total: 0,
    ids: [],
  },
  4: {
    total: 0,
    ids: [],
  },
  5: {
    total: 0,
    ids: [],
  },
  6: {
    total: 0,
    ids: [],
  },
};

const main = async () => {
  const tasks = await findTasks({ type: "CRAWL_SHOP" });
  tasks.forEach((task) => {
    initStatsPerDay[task.weekday].total += task.productLimit;
    initStatsPerDay[task.weekday].ids.push(task.id);
  });
  const tasksCreated = await Promise.all(
    newShops.map(async (shop) => {
      const task = tasks.find((task) => task.shopDomain === shop.d);
      if (!task) {
        await createSingleCrawlAznListingsTask(shop.d);
        await createSingleMatchTask(shop.d);
        await createCrawlAznListingsTask(shop.d, shop.productLimit);
        await createCrawlEbyListingsTask(shop.d, shop.productLimit);
        await createDailySalesTask(
          shop.d,
          shop.categories,
          shop.salesProductLimit,
          shop.proxyType
        );
        return createCrawlTasks(shop.d, shop.gb, shop.maxProducts);
      } else {
        console.log(`Tasks for ${shop.d} already exists!`);
      }
    })
  );

  await Promise.all(
    newShops.map(async (shop) => {
      await updateShopWithQuery(
        { d: shop.d },
        { active: true, hasEan: shop.hasEan, proxyType: shop.proxyType }
      );
    })
  );

  if (tasksCreated) {
    await distributeCrawlTasksToDays(initStatsPerDay);
    setTimeout(async () => {
      const new_tasks = await findTasks({ type: "CRAWL_SHOP" });
      new_tasks.forEach((task) => {
        statsPerDay[task.weekday].total += task.productLimit;
        statsPerDay[task.weekday].ids.push(task.id);
      });
      console.log(statsPerDay);
    }, 1000);
  }
};

main().then();
