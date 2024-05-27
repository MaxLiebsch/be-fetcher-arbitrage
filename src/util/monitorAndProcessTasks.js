import match from "../services/match.js";
import lookup from "../services/lookup.js";
import crawl from "../services/crawl.js";
import scan from "../services/scan.js";
import wholesale from "../services/wholesale.js";
import {
  findTasks,
  getNewTask,
  updateTask,
  updateTaskWithQuery,
} from "../services/db/util/tasks.js";
import { sendMail } from "../email.js";
import os from "os";
import {
  ProductLimitReachedStatus,
  TaskCompletedStatus,
  TimeLimitReachedStatus,
} from "../status.js";
import { LoggerService } from "@dipmaxtech/clr-pkg";
import { updateShopStats } from "../services/db/util/shops.js";
import { getMatchingProgress } from "../services/db/util/getMatchingProgress.js";
import { getAmazonLookupProgress } from "../services/db/util/getLookupProgress.js";
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
import { getWholesaleProgress } from "../services/db/util/getWholesaleProgress.js";
import isTaskComplete from "../util/isTaskComplete.js";
import calculatePageLimit from "../util/calculatePageLimit.js";

const hostname = os.hostname();
const { errorLogger } = LoggerService.getSingleton();

let taskId = "";

async function executeTask(task) {
  const { type } = task;
  if (type === "CRAWL_SHOP") {
    return await crawl(task);
  }
  if (type === "WHOLESALE_SEARCH") {
    return await wholesale(task);
  }
  if (type === "SCAN_SHOP") {
    return await scan(task);
  }
  if (type === "MATCH_PRODUCTS") {
    return await match(task);
  }
  if (type === "LOOKUP_PRODUCTS") {
    return await lookup(task);
  }
}

async function checkForNewTask() {
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

    const isMatchLookup =
      type === "MATCH_PRODUCTS" || type === "LOOKUP_PRODUCTS";
    const isWholeSale = type === "WHOLESALE_SEARCH";
    const isCrawl = type === "CRAWL_SHOP";
    const maxRetries =
      isMatchLookup || isWholeSale
        ? DEFAULT_MAX_TASK_RETRIES
        : MAX_TASK_RETRIES;
    const cooldown = new Date(Date.now() + COOLDOWN).toISOString(); // 30 min from now
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
      let subject = `${hostname}: ${type}: ${shopDomain}`;

      // Update progress for lookup stage
      if (isMatchLookup) {
        const lookupProgress = await getAmazonLookupProgress(shopDomain);
        if (lookupProgress)
          await updateTaskWithQuery(
            {
              type: "LOOKUP_PRODUCTS",
              id: `lookup_products_${shopDomain}`,
            },
            { progress: lookupProgress }
          );
      }
      // Update progress for match stage
      if (isCrawl || type === "MATCH_PRODUCTS") {
        const progress = await getMatchingProgress(shopDomain);
        if (progress)
          await updateTaskWithQuery(
            { type: "MATCH_PRODUCTS", id: `match_products_${shopDomain}` },
            { progress }
          );
      }
      if (isWholeSale) {
        const progress = await getWholesaleProgress(_id, task.progress.total);
        if (progress) {
          await updateTaskWithQuery({ _id }, { progress });
        }
      }

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
        await updateTask(_id, update);
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

          console.log("currentRetry:", currentRetry);
          const update = {
            cooldown,
            completedAt,
            lastCrawler: lastCrawler.filter((crawler) => crawler !== hostname),
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

          if (isMatchLookup) {
            update.cooldown = cooldown;
          }
          await updateTask(_id, update);
        } else {
          //states are only relevant for match, lookup and crawl
          !isWholeSale && (await updateShopStats(shopDomain));
          subject = "🆗 " + subject + " " + completionPercentage;

          const update = {
            completedAt,
            lastCrawler: lastCrawler.filter((crawler) => crawler !== hostname),
            executing: false,
            completed,
            retry: newRetry,
            errored,
          };
          if (isMatchLookup) {
            update.cooldown = cooldown;
          }
          await updateTask(_id, update);
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
          lastCrawler: lastCrawler.filter((crawler) => crawler !== hostname),
          errored: false,
        };
        if (isMatchLookup) {
          update.cooldown = cooldown;
        }
        await updateTask(_id, update);
      } else {
        const update = {
          completed: true,
          executing: false,
          lastCrawler: lastCrawler.filter((crawler) => crawler !== hostname),
          errored: true,
        };
        if (isMatchLookup) {
          update.cooldown = cooldown;
        }
        await updateTask(_id, update);
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
