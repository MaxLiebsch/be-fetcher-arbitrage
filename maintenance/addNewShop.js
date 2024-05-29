import { findTasks, getTasks } from "../src/services/db/util/tasks.js";
import { createCrawlTasks } from "../src/task.js";
import { distributeCrawlTasksToDays } from "./distributeCrawlTasksToDays.js";

const newShops = ["dm.de", "saturn.de", "fressnapf.de", "cyberport.de"];

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

  const tasksCreated = Promise.all(
    newShops.map(async (shop) => {
      const task = tasks.find((task) => task.shopDomain === shop);
      if (!task) {
        return createCrawlTasks(shop);
      } else {
        console.log(`Tasks for ${shop} already exists!`);
      }
    })
  );

  if (tasksCreated) {
    await distributeCrawlTasksToDays();
  }
  
  const new_tasks = await findTasks({ type: "CRAWL_SHOP" });
  new_tasks.forEach((task) => {
    console.log('task:', task.weekday)
    statsPerDay[task.weekday].total += task.productLimit;
    statsPerDay[task.weekday].ids.push(task.id);
  });
  console.log(statsPerDay);

  //   const logs = await getLogs({ infos: { $exists: true }, type: "CRAWL_SHOP" });
  //   console.log("logs:", logs.length);
};

main().then();
