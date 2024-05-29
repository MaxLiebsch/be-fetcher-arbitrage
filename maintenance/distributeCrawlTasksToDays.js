import { nextDay } from "date-fns";
import {
  findTasks,
  getTasks,
  updateTask,
} from "../src/services/db/util/tasks.js";
import { all } from "axios";

/*

    TODO:
    - lookup tasks can be done by multiple servers

    crawler: ['clr1', 'clr2', 'clr3']

*/

export const distributeCrawlTasksToDays = async () => {
  /*
    max matches per day: 46574
    productLimit
    completedAt: '2024-05-02T09:15:10.830Z',
    
    mon 
    tue
    wed
    thu
    fri
    sat
    sun
    
    {
        
        mon: 0 
        tue: 0
        wed: 0
        thu: 0
        fri: 0
        sat: 0
        sun: 0
    }
    
    
    Iterate over tasks with crawl_products
    
    
    when dayCount <= limitPerDay
    then change completedAt to this weekday
    add weekday to crawl task
    else
    next weekday
*/
  const limitPerDay = 15000;
  let total = 0;
  const weekdays = {
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

  const tasks = await findTasks({ type: "CRAWL_SHOP" });
  let currentDay = 0;
  let today = new Date();
  today.setDate(today.getDate() - 7);
  today.setHours(2, 0, 0, 0);
  let allDaysFull = false;

  await Promise.all[
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
  console.log("total", total);
};
