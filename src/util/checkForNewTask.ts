import { hostname } from "../db/mongo.js";
import { findTasks, getNewTask } from "../db/util/tasks.js";
import { Action } from "../types/tasks/Tasks.js";

export async function checkForNewTask() {
  const remainingTask = await findTasks({
    lastCrawler: hostname,
    maintenance: false,
  });
  if (remainingTask.length) {
    return { ...remainingTask[0], action: "recover" as Action };
  }
  const task = await getNewTask();
  if (task) return task;
  return null;
}
