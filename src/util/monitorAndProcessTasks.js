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
import { COOLDOWN, NEW_TASK_CHECK_INTERVAL } from "../constants.js";
import { getWholesaleProgress } from "../services/db/util/getWholesaleProgress.js";

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
    if (task) {
      const isMatchLookup =
        task.type === "MATCH_PRODUCTS" || task.type === "LOOKUP_PRODUCTS";
      const isWholeSale = task.type === "WHOLESALE_SEARCH";
      clearInterval(intervalId); // Stop checking while executing the task
      taskId = task.id;
      const shopDomain = task.shopDomain;

      executeTask(task)
        .then(async (r) => {
          const { type } = task;
          // Update progress for lookup stage
          if (type === "MATCH_PRODUCTS" || type === "LOOKUP_PRODUCTS") {
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
          if (type === "CRAWL_SHOP" || type === "MATCH_PRODUCTS") {
            const progress = await getMatchingProgress(shopDomain);
            if (progress)
              await updateTaskWithQuery(
                { type: "MATCH_PRODUCTS", id: `match_products_${shopDomain}` },
                { progress }
              );
          }
          if (type === "WHOLESALE_SEARCH") {
            const progress = await getWholesaleProgress(
              task._id,
              task.progress.total
            );
            if (progress) {
              await updateTaskWithQuery({ _id: task._id }, { progress });
            }
          }

          const cooldown = new Date(Date.now() + COOLDOWN).toISOString(); // 30 min from now

          if (
            r instanceof ProductLimitReachedStatus ||
            r instanceof TimeLimitReachedStatus
          ) {
            const update = {
              completed: false,
              executing: false,
              errored: false,
              lastCrawler: task.lastCrawler.filter(
                (crawler) => crawler !== hostname
              ),
            };
            if (isMatchLookup) {
              update.cooldown = cooldown;
            }
            await updateTask(task._id, update);
          }
          let completed = true;
          let completedAt = new Date().toISOString();
          let retry = 0;
          let errored = false;
          if (r instanceof TaskCompletedStatus) {
            const { processedProducts } = r.result;
            //nothing is crawled try again
            if (processedProducts === 0) {
              if (task.retry !== undefined && task.retry < 3) {
                completedAt = "";
                retry = task.retry + 1;
              }
              // //including 3
              if (retry > 3 && isMatchLookup) {
                cooldown = new Date(Date.now() + COOLDOWN * 3).toISOString(); // 3 hours from now
              }

              const update = {
                cooldown,
                completedAt,
                lastCrawler: task.lastCrawler.filter(
                  (crawler) => crawler !== hostname
                ),
                executing: false,
                completed,
                retry,
                errored,
              };
              if (isMatchLookup) {
                update.cooldown = cooldown;
              }
              await updateTask(task._id, update);
            } else {
              //updates stats
              !isWholeSale && await updateShopStats(shopDomain);
              const update = {
                completedAt,
                lastCrawler: task.lastCrawler.filter(
                  (crawler) => crawler !== hostname
                ),
                executing: false,
                completed,
                retry,
                errored,
              };
              if (isMatchLookup) {
                update.cooldown = cooldown;
              }
              await updateTask(task._id, update);
            }
          }

          const text = JSON.stringify(
            {
              shop: shopDomain,
              taskId: task.id,
              name: r.name,
              ...r.result,
              message: r.message,
            },
            null,
            2
          );
          const htmlBody = `\n<h1>Summary</h1>\n<pre>${text}</pre>\n\n`;
          await sendMail({
            subject: `${hostname}: ${task.type}: ${shopDomain}`,
            html: htmlBody,
          });
          monitorAndProcessTasks().then(); // Resume checking after task execution
        })
        .catch(async (error) => {
          console.log("error:", error);
          errorLogger.error({
            error,
            taskId: task.id,
            type: task.type,
            hostname,
          });
          const cooldown = new Date(Date.now() + COOLDOWN).toISOString(); // 30 min from now

          if (error instanceof MissingProductsError) {
            const update = {
              completed: true,
              executing: false,
              completedAt: new Date().toISOString(),
              lastCrawler: task.lastCrawler.filter(
                (crawler) => crawler !== hostname
              ),
              errored: false,
            };
            if (isMatchLookup) {
              update.cooldown = cooldown;
            }
            await updateTask(task._id, update);
          } else {
            const update = {
              completed: true,
              executing: false,
              lastCrawler: task.lastCrawler.filter(
                (crawler) => crawler !== hostname
              ),
              errored: true,
            };
            if (isMatchLookup) {
              update.cooldown = cooldown;
            }
            await updateTask(task._id, update);
          }
          const htmlBody = `\n<h1>Summary</h1>\n<pre>${error?.message}</pre>\n${error?.stack}\n${task.type}\n${task.id}\n\n`;
          await sendMail({
            subject: `${hostname}: Error: ${error?.name}`,
            html: htmlBody,
          });
          monitorAndProcessTasks().then(); // Resume processing error
        });
    }
  }, NEW_TASK_CHECK_INTERVAL); // Check every 5 seconds
}
