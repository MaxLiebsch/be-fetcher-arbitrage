import { LoggerService, ProcessTimeTracker } from "@dipmaxtech/clr-pkg";
import { UTCDate } from "@date-fns/utc";
import { executeTask } from "./executeTask.js";
import { handleTask } from "./taskHandler.js";
import { checkForNewTask } from "./checkForNewTask.js";
import { updateTask } from "../db/util/tasks.js";
import { sendMail } from "../email.js";
import { TaskCompletedStatus, TimeLimitReachedStatus } from "../status.js";
import { MissingProductsError } from "../errors.js";
import { COOLDOWN, NEW_TASK_CHECK_INTERVAL } from "../constants.js";

import { hostname } from "../db/mongo.js";
import clientPool from "../db/mongoPool.js";
import {
  updateProgressDealTasks,
  updateProgressNegDealTasks,
} from "./updateProgressInTasks.js";
import { TASK_TYPES } from "./taskTypes.js";
import { Task } from "../types/tasks/Tasks.js";
import { logGlobal } from "./logger.js";

const timeTracker = ProcessTimeTracker.getSingleton(
  hostname,
  clientPool["crawler-data"]
);
let taskId = "";

export async function monitorAndProcessTasks() {
  logGlobal(`Checking for new tasks on ${hostname}`);
  const intervalId = setInterval(async () => {
    const task = await checkForNewTask(); // Implement this function to check for new tasks
    if (!task) {
      return;
    }
    clearInterval(intervalId); // Stop checking while executing the task
    logGlobal(`Task ${task.id} ${task.type} found`);

    const { type, id, _id } = task;

    const isMatchLookup =
      type === TASK_TYPES.MATCH_PRODUCTS || type === TASK_TYPES.NEG_AZN_DEALS;
    taskId = id;

    try {
      if (!timeTracker.initialized) await timeTracker.initPromise;
      timeTracker.markActive(task.type);
      logGlobal(`Executing task ${id} ${type}`);
      const startTime = Date.now();
      const taskResult = await executeTask(task);
      const endTime = Date.now();
      logGlobal(
        `Task ${id} ${type} executed, took ${(endTime - startTime) / 1000/ 1000} min.`
      );
      timeTracker.markInactive();

      if (taskResult instanceof TimeLimitReachedStatus) {
        const update = {
          completed: false,
          executing: false,
        };
        await updateTask(_id, {
          $set: update,
          $pull: { lastCrawler: hostname },
        });
        return;
      }
      if (taskResult instanceof TaskCompletedStatus) {
        await updateProgressDealTasks("mix");
        await updateProgressNegDealTasks("mix");

        const { priority, subject, htmlBody } = await handleTask(
          taskResult,
          task
        );
        if (
          priority === "high" ||
          task.type === TASK_TYPES.CRAWL_SHOP ||
          task.type === TASK_TYPES.DAILY_SALES
        ) {
          await sendMail({
            priority,
            subject,
            html: htmlBody,
          });
        }
      }
      logGlobal(
        `Task ${id} ${type} completed - Resume checking after task execution`
      );
      monitorAndProcessTasks().then(); // Resume checking after task execution
    } catch (error) {
      timeTracker.markInactive();
      logGlobal(
        `Hostname: ${hostname} TaskId: ${id} Type: ${type} Error: ${error}`
      );
      const cooldown = new UTCDate(Date.now() + COOLDOWN).toISOString(); // 30 min from now

      if (error instanceof MissingProductsError) {
        const update: Pick<Task, "executing" | "completedAt"> &
          Partial<Pick<Task, "cooldown">> = {
          executing: false,
          completedAt: new UTCDate().toISOString(),
        };
        if (isMatchLookup) {
          update.cooldown = cooldown;
        }
        await updateTask(_id, {
          $set: update,
          $pull: { lastCrawler: hostname },
        });
      } else if (error instanceof Error) {
        const update: Pick<Task, "executing" | "completed"> &
          Partial<Pick<Task, "cooldown">> = {
          completed: true,
          executing: false,
        };
        if (isMatchLookup) {
          update.cooldown = cooldown;
        }
        await updateTask(_id, {
          $set: update,
          $pull: { lastCrawler: hostname },
        });
        const htmlBody = `\n<h1>Summary</h1>\n<pre>${error?.message}</pre>\n${error?.stack}\n${type}\n${id}\n\n`;
        await sendMail({
          priority: "high",
          subject: `🚱 ${hostname}: Error: ${error?.name}`,
          html: htmlBody,
        });
      }

      monitorAndProcessTasks().then(); // Resume processing error
    }
  }, NEW_TASK_CHECK_INTERVAL); // Check every 5 seconds
}
