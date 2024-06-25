import { nextDay } from "date-fns";
import {
  findTasks,
  getTasks,
  updateTask,
} from "../src/services/db/util/tasks.js";
import { all } from "axios";


export const distributeCrawlTasksToDays = async (initalWeekdaysSplit) => {
  const limitPerDay = 26000;
  let total = 0;
  let weekdays = initalWeekdaysSplit || {
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
  
  let ids = [];
  
  Object.values(weekdays).forEach((day) => {
    ids.push(...day.ids);
  });
  
  const tasks = await findTasks({ type: "CRAWL_SHOP", id: { $nin: ids } });

  let currentDay = 0;
  let today = new Date();
  today.setDate(today.getDate() - 7);
  today.setHours(2, 0, 0, 0);
  let allDaysFull = false;

  return Promise.all[
    tasks.map(async (task) => {
      const { productLimit } = task;
      total += productLimit;
      let weekday = 0;
      const currWeekdayTotal = weekdays[currentDay].total;

      // reset and start on day one!
      if (currentDay === 6) {
        currentDay = 0;
      }

      if (
        currWeekdayTotal <= limitPerDay &&
        currWeekdayTotal + productLimit < limitPerDay &&
        !weekdays[currentDay].ids.some((id) => id.includes(task.shopDomain))
      ) {
        weekdays[currentDay].ids.push(task.id);
        if (task.completedAt === "") {
          const nextCrawlDay = nextDay(today, currentDay).toISOString();
          task.completedAt = nextCrawlDay;
        }
        weekdays[currentDay].total += productLimit;
        weekday = nextDay(today, currentDay).getDay();
      } else {
        currentDay += 1;
        if (weekdays[currentDay].total >= limitPerDay && !allDaysFull) {
          allDaysFull = true;
          currentDay = 0;
        }
        if (
          allDaysFull &&
          !weekdays[currentDay].ids.some((id) => id.includes(task.shopDomain))
        ) {
          let minTotal = weekdays[0].total;
          let minDay = 0;
          Object.keys(weekdays)
            .reverse()
            .forEach((key) => {
              if (weekdays[key].total < minTotal) {
                minDay = parseInt(key);
                minTotal = weekdays[key].total;
              }
            });
          currentDay = minDay;
        }
        weekdays[currentDay].ids.push(task.id);
        if (task.completedAt === "") {
          const nextCrawlDay = nextDay(today, currentDay).toISOString();
          task.completedAt = nextCrawlDay;
        }
        weekdays[currentDay].total += productLimit;
        weekday = nextDay(today, currentDay).getDay();
   
      }
      await updateTask(task._id, {
        weekday,
        completedAt: task.completedAt,
      });
    })
  ];
};
