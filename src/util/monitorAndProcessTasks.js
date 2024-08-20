import { updateTask } from "../services/db/util/tasks.js";
import { sendMail } from "../email.js";
import { TaskCompletedStatus, TimeLimitReachedStatus } from "../status.js";
import { LoggerService, ProcessTimeTracker } from "@dipmaxtech/clr-pkg";
import { MissingProductsError } from "../errors.js";
import { COOLDOWN, NEW_TASK_CHECK_INTERVAL } from "../constants.js";

import { executeTask } from "./executeTask.js";
import { checkForNewTask } from "./checkForNewTask.js";
import { hostname } from "../services/db/mongo.js";
import { handleTask } from "./taskHandler.js";
import clientPool from "../services/db/mongoPool.js";
import { UTCDate } from "@date-fns/utc";

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
      type === "MATCH_PRODUCTS" || type === "CRAWL_AZN_LISTINGS";
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
        const { priority, subject, htmlBody } = await handleTask(
          taskResult,
          task
        );
        if (
          priority === "high" ||
          task.type === "CRAWL_SHOP" ||
          task.type === "DAILY_SALES" ||
          task.type === "DEALS_ON_EBY" ||
          task.type === "DEALS_ON_AZN"
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
        const update = {
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
      } else {
        const update = {
          completed: true,
          executing: false,
          errored: true,
        };
        if (isMatchLookup) {
          update.cooldown = cooldown;
        }
        await updateTask(_id, {
          $set: update,
          $pull: { lastCrawler: hostname },
        });
      }
      const htmlBody = `\n<h1>Summary</h1>\n<pre>${error?.message}</pre>\n${error?.stack}\n${type}\n${id}\n\n`;
      await sendMail({
        priority: "high",
        subject: `🚱 ${hostname}: Error: ${error?.name}`,
        html: htmlBody,
      });

      monitorAndProcessTasks().then(); // Resume processing error
    }
  }, NEW_TASK_CHECK_INTERVAL); // Check every 5 seconds
}
