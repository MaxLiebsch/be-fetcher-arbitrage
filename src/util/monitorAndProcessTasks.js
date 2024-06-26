import { updateTask } from "../services/db/util/tasks.js";
import { sendMail } from "../email.js";
import { TaskCompletedStatus, TimeLimitReachedStatus } from "../status.js";
import { LoggerService } from "@dipmaxtech/clr-pkg";
import { updateShopStats } from "../services/db/util/shops.js";
import { MissingProductsError } from "../errors.js";
import {
  COOLDOWN,
  NEW_TASK_CHECK_INTERVAL,
  MAX_TASK_RETRIES,
  COOLDOWN_MULTIPLIER,
  DEFAULT_MAX_TASK_RETRIES,
  COMPLETE_FAILURE_THRESHOLD,
  SAVEGUARD_INCREASE_PAGE_LIMIT_RUNAWAY_THRESHOLD,
} from "../constants.js";
import isTaskComplete from "../util/isTaskComplete.js";
import calculatePageLimit from "../util/calculatePageLimit.js";
import { executeTask } from "./executeTask.js";
import { getTaskSymbol } from "./getTaskSymbol.js";
import { checkForNewTask } from "./checkForNewTask.js";
import { hostname } from "../services/db/mongo.js";

const { errorLogger } = LoggerService.getSingleton();

let taskId = "";

export async function monitorAndProcessTasks() {
  const intervalId = setInterval(async () => {
    const task = await checkForNewTask(); // Implement this function to check for new tasks
    if (!task) return;

    const {
      type,
      productLimit,
      id,
      shopDomain,
      lastCrawler,
      retry: currentRetry,
      limit,
      _id,
    } = task;

    const isCrawl = type === "CRAWL_SHOP";
    const isCrawlEan = type === "CRAWL_EAN";
    const isMatch = type === "MATCH_PRODUCTS";
    const isLookupInfo = type === "LOOKUP_INFO";
    const isCrawlAznListings = type === "CRAWL_AZN_LISTINGS";
    const isMatchLookup =
      type === "MATCH_PRODUCTS" || type === "CRAWL_AZN_LISTINGS";
    const isWholeSale = type === "WHOLESALE_SEARCH";
    const isScan = type === "SCAN_SHOP";
    const maxRetries =
      isMatchLookup || isWholeSale
        ? DEFAULT_MAX_TASK_RETRIES
        : MAX_TASK_RETRIES;
    const cooldown = new Date(
      Date.now() + process.env.DEBUG ? 1000 * 60 * 2 : COOLDOWN
    ).toISOString(); // 30 min from now
    clearInterval(intervalId); // Stop checking while executing the task
    taskId = id;

    try {
      const taskResult = await executeTask(task);
      const { name, result, message } = taskResult;
      let completed = true;
      let completedAt = new Date().toISOString();
      let newRetry = 0;
      let errored = false;
      let priority = "normal";

      let subject = `${getTaskSymbol(type)} ${hostname}: ${id}`;

      if (taskResult instanceof TimeLimitReachedStatus) {
        const update = {
          completed: false,
          executing: false,
          errored: false,
          lastCrawler: lastCrawler.filter((crawler) => crawler !== hostname),
        };
        if (isMatchLookup) {
          update.cooldown = cooldown;
        }
        await updateTask(_id, {
          $set: update,
          $pull: { lastCrawler: hostname },
        });
      }

      if (taskResult instanceof TaskCompletedStatus) {
        const { taskCompleted, completionPercentage } = isTaskComplete(
          type,
          result.infos,
          productLimit
        );
        console.log(type, " completed? ", taskCompleted);
        if (!taskCompleted) {
          subject = "🚱 " + subject + " " + completionPercentage;
          priority = "high";
          if (currentRetry < maxRetries) {
            completedAt = "";
            newRetry = currentRetry + 1;
          }
          // Retry the task if not completed and retry is less than 3 times and task is match, lookup
          // after 3 hours cooldown
          if (currentRetry > maxRetries && isMatchLookup) {
            cooldown = new Date(
              Date.now() + COOLDOWN * COOLDOWN_MULTIPLIER
            ).toISOString();
          }

          const update = {
            cooldown,
            completedAt,
            executing: false,
            completed,
            retry: newRetry,
            errored,
          };

          if (
            isCrawl &&
            result.infos.total > COMPLETE_FAILURE_THRESHOLD &&
            limit.pages <= SAVEGUARD_INCREASE_PAGE_LIMIT_RUNAWAY_THRESHOLD
          ) {
            const newPageLimit = calculatePageLimit(
              limit.pages,
              productLimit,
              result.infos.total
            );
            update.limit = {
              ...limit,
              pages: newPageLimit,
            };
          }
          if (isCrawl && newRetry === maxRetries) {
            update.productLimit = result.infos.total;
          }

          if (isMatchLookup) {
            update.cooldown = cooldown;
          }
          await updateTask(_id, {
            $set: update,
            $pull: { lastCrawler: hostname },
          });
        } else {
          //states are only relevant for match, lookup and crawl
          if (!isWholeSale && !isCrawlEan && !isLookupInfo) {
            await updateShopStats(shopDomain);
          }
          subject = "🆗 " + subject + " " + completionPercentage;

          const update = {
            completedAt,
            executing: false,
            completed,
            retry: newRetry,
            errored,
          };
          if (isMatchLookup) {
            update.cooldown = cooldown;
          }
          await updateTask(_id, {
            $set: update,
            $pull: { lastCrawler: hostname },
          });
        }
      }

      const text = JSON.stringify(
        {
          shop: shopDomain,
          taskId: id,
          name,
          ...result,
          message,
        },
        null,
        2
      );
      const htmlBody = `\n<h1>Summary</h1>\n<pre>${text}</pre>\n\n`;
      await sendMail({
        priority,
        subject,
        html: htmlBody,
      });
      monitorAndProcessTasks().then(); // Resume checking after task execution
    } catch (error) {
      errorLogger.error({
        error,
        taskId: id,
        type: type,
        hostname,
      });
      const cooldown = new Date(Date.now() + COOLDOWN).toISOString(); // 30 min from now

      if (error instanceof MissingProductsError) {
        const update = {
          completed: true,
          executing: false,
          completedAt: new Date().toISOString(),
          errored: false,
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
