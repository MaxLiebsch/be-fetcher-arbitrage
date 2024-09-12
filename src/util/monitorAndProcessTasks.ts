import { updateTask } from "../db/util/tasks";
import { sendMail } from "../email";
import { TaskCompletedStatus, TimeLimitReachedStatus } from "../status";
import { LoggerService, ProcessTimeTracker } from "@dipmaxtech/clr-pkg";
import { MissingProductsError } from "../errors";
import { COOLDOWN, NEW_TASK_CHECK_INTERVAL } from "../constants";

import { executeTask } from "./executeTask";
import { checkForNewTask } from "./checkForNewTask";
import { hostname } from "../db/mongo";
import { handleTask } from "./taskHandler";
import clientPool from "../db/mongoPool";
import { UTCDate } from "@date-fns/utc";
import {
  updateProgressDealTasks,
  updateProgressNegDealTasks,
} from "./updateProgressInTasks";
import { TASK_TYPES } from "./taskTypes";
import { Task } from "../types/tasks/Tasks";

const { errorLogger } = LoggerService.getSingleton();

const timeTracker = ProcessTimeTracker.getSingleton(
  hostname,
  clientPool["crawler-data"]
);
let taskId = "";

export async function monitorAndProcessTasks() {
  const intervalId = setInterval(async () => {
    const task = await checkForNewTask(); // Implement this function to check for new tasks
    if (!task) return;

    const { type, id, _id } = task;

    const isMatchLookup =
      type === TASK_TYPES.MATCH_PRODUCTS || type === TASK_TYPES.NEG_AZN_DEALS;
    clearInterval(intervalId); // Stop checking while executing the task
    taskId = id;

    try {
      if (!timeTracker.initialized) await timeTracker.initPromise;
      timeTracker.markActive(task.type);
      const taskResult = await executeTask(task);
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
      monitorAndProcessTasks().then(); // Resume checking after task execution
    } catch (error) {
      timeTracker.markInactive();
      errorLogger.error({
        error,
        taskId: id,
        type: type,
        hostname,
      });
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
