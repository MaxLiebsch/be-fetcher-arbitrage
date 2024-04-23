import match from "./match.js";
import crawl from "./crawl.js";
import { findTasks, getNewTask, updateShopStats, updateTask } from "./mongo.js";
import { sendMail } from "./email.js";
import os from "os";
import {
  ProductLimitReachedStatus,
  TaskCompletedStatus,
  TimeLimitReachedStatus,
} from "./status.js";
import { flatten } from "flatten-anything";
import { LoggerService } from "@dipmaxtech/clr-pkg";

async function monitorAndProcessTasks() {
  const intervalId = setInterval(async () => {
    const task = await checkForNewTask(); // Implement this function to check for new tasks
    if (task) {
      clearInterval(intervalId); // Stop checking while executing the task
      executeTask(task)
        .then(async (r) => {
          if (
            r instanceof ProductLimitReachedStatus ||
            r instanceof TimeLimitReachedStatus
          ) {
            await updateTask(task._id, {
              completed: false,
              executing: false,
              errored: false,
              lastCrawler: "",
              action: "",
              reason: r.name,
              result: r.result,
            });
          }
          if (r instanceof TaskCompletedStatus) {
            let completed = true;
            let reason = r.name;
            let retry = 0;
            let errored = false;
            //nothing is crawled try again
            if (r.result.crawledPages === 0 && r.result.products_cnt === 0) {
              if (task?.retry) {
                completed = false;
                retry = task.retry + 1;
              }
              //including 3
              if (retry > 3) {
                completed = true;
                errored = true;
                reason = "Max retries reached";
              }
            } else {
              //updates stats
              await updateShopStats(task.shopDomain);
            }
            await updateTask(task._id, {
              completed,
              retry,
              errored,
              lastCrawler: "",
              action: "",
              completedAt: new Date().toISOString(),
              executing: false,
              reason,
              result: r.result,
            });
          }
          const text = JSON.stringify(flatten(r), null, 2);
          const htmlBody = `\n<h1>Summary</h1>\n<pre>${text}</pre>\n\n`;
          await sendMail({
            subject: `Task: ${task?.id ?? r.name} on ${os.hostname()}`,
            html: htmlBody,
          });
          monitorAndProcessTasks().then(); // Resume checking after task execution
        })
        .catch(async (error) => {
          LoggerService.getSingleton().logger.info(error);
          await updateTask(task._id, {
            completed: false,
            executing: false,
            action: "",
            errored: true,
            reason: error.name,
          });
          const text = JSON.stringify(flatten(error), null, 2);
          const htmlBody = `\n<h1>Summary</h1>\n<pre>${text}</pre>\n\n`;
          await sendMail({
            subject: `Taskerror: ${error.name} on ${os.hostname()}`,
            html: htmlBody,
          });
        });
    }
  }, 1 * 5 * 1000); // Check every 1 Minutes
}

async function executeTask(task) {
  const { type } = task;
  if (type === "SCAN_SHOP" || type === "CRAWL_SHOP") {
    return await crawl(task);
  }
  if (type === "LOOKUP_PRODUCTS") {
    return await match(task);
  }
}

async function checkForNewTask() {
  const ninetyMinutesAgo = new Date();
  ninetyMinutesAgo.setMinutes(ninetyMinutesAgo.getMinutes() - 90);

  const remainingTask = await findTasks({
    lastCrawler: os.hostname(),
    $or: [
      { executing: true, errored: false },
      { executing: false, errored: true },
    ],
    startedAt: { $lte: ninetyMinutesAgo.toISOString() },
  });
  if (remainingTask.length) {
    return { ...remainingTask[0], action: "recover" };
  }
  const task = await getNewTask();
  if (task) return task;
  return null;
}

monitorAndProcessTasks()
  .then()
  .catch((e) => {
    LoggerService.getSingleton().logger(
      `Error: Queue failed on ${os.hostname()} error: ${e}`
    );
    sendMail({
      subject: `Error: Queue failed on ${os.hostname()}`,
      html: e,
    }).then();
  });
