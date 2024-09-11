import { hostname } from "../db/mongo.js";
import { findTasks, getNewTask } from "../db/util/tasks.js";

export async function checkForNewTask() {
  const remainingTask = await findTasks({
    lastCrawler: hostname,
    maintenance: false,
  });
  if (remainingTask.length) {
    return { ...remainingTask[0], action: "recover" };
  }
  const task = await getNewTask();
  if (task) return task;
  return null;
}

