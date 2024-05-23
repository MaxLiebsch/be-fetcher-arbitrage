import { format, nextDay, parseISO } from "date-fns";
import { getTasks, updateTask } from "./util/tasks.js";

/*

    TODO:
    - lookup tasks can be done by multiple servers

    crawler: ['clr1', 'clr2', 'clr3']

*/

const distributeCrawlTasksToDays = async () => {
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
  const limitPerDay = 12000;
  let total = 0;
  const weekdays = {
    0: 0,
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
  };

  const tasks = await getTasks();
  let currentDay = 0;
  let today = new Date();
  today.setDate(today.getDate() - 7);
  today.setHours(2, 0, 0, 0);

  return Promise.all[
    tasks.map(async (task) => {
      if (task.type !== "CRAWL_SHOP") return;
      const { productLimit } = task;
      total += productLimit;
      const currWeekday = weekdays[currentDay];

      // reset and start on day one!
      if (currentDay === 6) {
        console.log("Productlimit per day reached");
        currentDay = 0;
      }

      if (
        currWeekday <= limitPerDay &&
        currWeekday + productLimit < limitPerDay
      ) {
        const nextCrawlDay = nextDay(today, currentDay).toISOString();
        task.completedAt = nextCrawlDay;
        weekdays[currentDay] += productLimit;
        task.weekday = nextDay(today, currentDay).getDay();
      } else {
        currentDay += 1;
        const nextCrawlDay = nextDay(today, currentDay).toISOString();
        task.completedAt = nextCrawlDay;
        weekdays[currentDay] += productLimit;
        task.weekday = nextDay(today, currentDay).getDay();
      }
      await updateTask(task._id, {
        weekday: task.weekday,
        // completedAt: task.completedAt,
      });
    })
  ];
};

const main = async () => {
  distributeCrawlTasksToDays().then();
};

main().then();
