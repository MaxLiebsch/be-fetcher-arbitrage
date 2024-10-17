import {
  LocalLogger,
  ProcessTimeTracker,
  TaskTypes,
} from "@dipmaxtech/clr-pkg";

import { executeTask } from "./executeTask.js";
import { handleTask } from "./taskHandler.js";
import { checkForNewTask } from "./checkForNewTask.js";
import { updateTask } from "../db/util/tasks.js";
import { sendMail } from "../email.js";
import { TaskCompletedStatus, TimeLimitReachedStatus } from "../status.js";
import { MissingProductsError } from "../errors.js";
import {
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  NEW_TASK_CHECK_INTERVAL,
} from "../constants.js";

import { hostname } from "../db/mongo.js";
import clientPool from "../db/mongoPool.js";
import { TASK_TYPES } from "./taskTypes.js";
import { Task, Tasks } from "../types/tasks/Tasks.js";
import { logGlobal, setTaskLogger } from "./logger.js";

const timeTracker = ProcessTimeTracker.getSingleton(
  hostname,
  clientPool["crawler-data"]
);

function destroyLogger(type: TaskTypes) {
  logGlobal(`Destroying logger for task ${type} after execution`);
  LocalLogger.instance.destroy(type);
  setTaskLogger(null, "TASK_LOGGER");
}

function createLogger(type: TaskTypes) {
  logGlobal(`Creating logger for task ${type}`);
  const logger = new LocalLogger().createLogger(type);
  setTaskLogger(logger, "TASK_LOGGER");
}

async function executeTaskWithLogging(task: Tasks) {
  const { type, id: taskId, _id } = task;
  try {
    if (!timeTracker.initialized) await timeTracker.initPromise;
    const startTime = Date.now();
    createLogger(type);
    logGlobal(`Executing task ${taskId} ${type}`);
    timeTracker.markActive(task.type);
    const taskResult = await executeTask(task);
    timeTracker.markInactive();
    const endTime = Date.now();
    logGlobal(
      `Task ${taskId} ${type} executed, took ${
        (endTime - startTime) / 1000 / 1000
      } min.`
    );
    destroyLogger(type);
    return taskResult;
  } catch (error) {
    timeTracker.markInactive();
    logGlobal(
      `Hostname: ${hostname} TaskId: ${taskId} Type: ${type} Error: ${error}`
    );

    if (error instanceof MissingProductsError) {
      const update: Pick<Task, "executing"> & Partial<Pick<Task, "cooldown">> =
        {
          executing: false,
        };
      await updateTask(_id, {
        $set: update,
        $pull: { lastCrawler: hostname },
      });
    } else if (error instanceof Error) {
      const update: Pick<Task, "executing"> & Partial<Pick<Task, "cooldown">> =
        {
          executing: false,
        };
      await updateTask(_id, {
        $set: update,
        $pull: { lastCrawler: hostname },
      });
      const htmlBody = `\n<h1>Summary</h1>\n<pre>${error?.message}</pre>\n${error?.stack}\n${type}\n${taskId}\n\n`;
      await sendMail({
        priority: "high",
        subject: `🚱 ${hostname}: Error: ${error?.name}`,
        html: htmlBody,
      });
    }
  }
}

export async function monitorAndProcessTasks() {
  const intervalId = setInterval(async () => {
    clearInterval(intervalId); // Stop checking while executing the task
    const task = await checkForNewTask(); // Implement this function to check for new tasks

    if (!task) {
      monitorAndProcessTasks().then(); // Resume checking after task execution
      return;
    }

    try {
      const taskResult = await executeTaskWithLogging(task);

      if (taskResult instanceof TaskCompletedStatus) {
        logGlobal(
          `Task ${task.id} ${task.type} completed - Resume checking after task execution`
        );
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
      } else {
        logGlobal(`Task ${task.id} ${task.type} not completed`);
      }
    } catch (error) {
      logGlobal(`Error while executing task: ${error}`);
    } finally {
      monitorAndProcessTasks().then(); // Resume checking after task execution
    }
  }, NEW_TASK_CHECK_INTERVAL); // Check every 30 seconds
}
