import { hostname } from "../db/mongo.js";
import { getNewTask } from "../db/util/getNewTask.js";
import { findTask } from "../db/util/tasks.js";
import { Action } from "../types/tasks/Tasks.js";
import { logGlobal } from "./logger.js";

// const relevantRemainingProductsTasks: TaskTypes[] = [
//   TASK_TYPES.DEALS_ON_AZN,
//   TASK_TYPES.DEALS_ON_EBY,
//   TASK_TYPES.NEG_AZN_DEALS,
//   TASK_TYPES.NEG_EBY_DEALS,
//   TASK_TYPES.CRAWL_EAN,
//   TASK_TYPES.LOOKUP_INFO,
//   TASK_TYPES.QUERY_EANS_EBY,
//   TASK_TYPES.WHOLESALE_SEARCH,
//   TASK_TYPES.LOOKUP_CATEGORY,
// ];

export async function checkForNewTask() {
  const remainingTask = await findTask({
    lastCrawler: hostname,
    maintenance: false,
  });
  if (remainingTask) {
    logGlobal(`Recovering task ${remainingTask.id} ${remainingTask.id}`);
    return { ...remainingTask, action: "recover" as Action };
  }
  const task = await getNewTask();
  if (task) return task;
  return null;
}
