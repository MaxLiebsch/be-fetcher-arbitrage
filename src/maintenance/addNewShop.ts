import { ICategory } from "@dipmaxtech/clr-pkg";
import { getShop, updateShopWithQuery } from "../db/util/shops.js";
import { findTasks } from "../db/util/tasks.js";
import { createCrawlTasks, createDailySalesTask } from "../tasks.js";
import { distributeCrawlTasksToDays } from "./distributeCrawlTasksToDays.js";
import { ScrapeShopTask } from "../types/tasks/Tasks.js";
import { getArbispotterDb } from "../db/mongo.js";

export const newShops: {
  d: string;
  ne: string;
  maxProducts: number;
  productLimit: number;
  salesProductLimit: number;
  categories: ICategory[];
  dailySalesCategories: ICategory[];
}[] = [
  {
    d: "aldi-onlineshop.de",
    ne: "Aldi-onlineshop.de",
    maxProducts: 80000,
    productLimit: 500,
    salesProductLimit: 4000,
    categories: [],
    dailySalesCategories: [
      {
        name: "Sales",
        link: "https://www.aldi-onlineshop.de/aktionen/",
      },
    ],
  },
  // {
  //   d: "pieper.de",
  //   ne: "Pieper.de",
  //   maxProducts: 80000,
  //   productLimit: 500,
  //   salesProductLimit: 4000,
  //   categories: [],
  //   dailySalesCategories: [
  //     { link: "https://www.pieper.de/sale", name: "Sale" },
  //   ],
  // },
  // {
  //   d: "rossmann.de",
  //   ne: "Rossmann.de",
  //   maxProducts: 80000,
  //   productLimit: 500,
  //   salesProductLimit: 4000,
  //   categories: [],
  //   dailySalesCategories: [
  //     {
  //       link: "https://www.rossmann.de/de/angebote/m/angebote",
  //       name: "Sale",
  //     },
  //   ],
  // },
];

export type SplitStats = { [key: number]: { total: number; ids: string[] } };

const initStatsPerDay: SplitStats = {
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

const statsPerDay: SplitStats = {
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
  const db = await getArbispotterDb();
  const tasks = (await findTasks({ type: "CRAWL_SHOP" })) as ScrapeShopTask[];
  tasks.forEach((task) => {
    initStatsPerDay[task.weekday].total += task.productLimit;
    initStatsPerDay[task.weekday].ids.push(task.id);
  });

  const currentAvgPerDay = Math.ceil(
    Object.values(initStatsPerDay).reduce((acc, curr) => {
      return acc + curr.total;
    }, 0) / 7
  );

  const tasksCreated = await Promise.all(
    newShops.map(async (shop) => {
      await db.collection("shops").updateOne(
        { d: shop.d, ne: shop.ne },
        {
          $set: {
            d: shop.d,
            ne: shop.ne,
            active: true,
            a_cats: {},
            e_cats: {},
          },
        },
        { upsert: true }
      );
      const _shop = await getShop(shop.d);
      if (!_shop) {
        throw new Error(`Shop ${shop.d} not found!`);
      }
      const salesTask = tasks.find(
        (t) => t.shopDomain === shop.d && t.type === "DAILY_SALES"
      );
      if (!salesTask && shop.dailySalesCategories.length > 0) {
        await createDailySalesTask(
          shop.d,
          shop.dailySalesCategories,
          shop.salesProductLimit
        );
      } else {
        console.log(`Sales task for ${shop.d} already exists!`);
      }
      const task = tasks.find(
        (task) => task.shopDomain === shop.d && task.type === "CRAWL_SHOP"
      );
      if (!task) {
        return createCrawlTasks(_shop, shop.maxProducts);
      } else {
        console.log(`Tasks for ${shop.d} already exists!`);
      }
    })
  );

  await Promise.all(
    newShops.map(async (shop) => {
      await updateShopWithQuery({ d: shop.d }, { active: true });
    })
  );

  if (tasksCreated) {
    await distributeCrawlTasksToDays(initStatsPerDay, currentAvgPerDay);
    setTimeout(async () => {
      const new_tasks = (await findTasks({
        type: "CRAWL_SHOP",
      })) as ScrapeShopTask[];
      new_tasks.forEach((task) => {
        statsPerDay[task.weekday].total += task.productLimit;
        statsPerDay[task.weekday].ids.push(task.id);
      });
      console.log(statsPerDay);
    }, 1000);
  }
};

main().then();
