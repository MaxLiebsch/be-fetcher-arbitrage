import { describe, expect, test, beforeAll } from "@jest/globals";
import { setTaskLogger } from "../../src/util/logger";
import { LocalLogger } from "@dipmaxtech/clr-pkg";
import scrapeShop from "../../src/services/scrapeShop";
import { sub } from "date-fns";
import { ScrapeShopTask } from "../../src/types/tasks/Tasks";
import {
  deleteTasks,
  findTask,
  getTasks,
  insertTasks,
} from "../../src/db/util/tasks";
import { path, read } from "fs-jetpack";
import { after } from "underscore";

const today = new Date();
const productLimit = 150;
const yesterday = sub(today, { days: 1 });

describe("crawlproducts", () => {
  beforeAll(async () => {
    await deleteTasks();
    const tasks = read(
      path(`__test__/static/collections/crawler-data.tasks.json`),
      "json"
    );
    if (!tasks) throw new Error("Tasks not found");
    const _tasks = tasks.map((t: any) => {
      delete t._id;
      return t;
    })
    await insertTasks(_tasks);
  });
  test("lookup info listings", async () => {
    const task = (await findTask({
      id: "crawl_shop_cyberport.de_1_of_4",
    })) as ScrapeShopTask;
    if (!task) {
      console.log("Task not found");
      throw new Error("Task not found");
    }
    task.weekday = today.getDay();
    task.startedAt = yesterday.toISOString();
    task.completedAt = yesterday.toISOString();
    task.productLimit = productLimit;
    const logger = new LocalLogger().createLogger("CRAWL_SHOP");
    setTaskLogger(logger, "TASK_LOGGER");
    ``;

    const infos = await scrapeShop(task as unknown as ScrapeShopTask);
    console.log(JSON.stringify(infos, null, 2));
  }, 1000000);

  afterAll(async () => {
    await deleteTasks();
  });
});
