import match from "./match.js";
import crawl from "./crawl.js";
import { getNewTask, updateTask } from "./mongo.js";
import { sendMail } from "./email.js";
import os from "os";
import {
  ProductLimitReachedStatus,
  TaskCompletedStatus,
  TimeLimitReachedStatus,
} from "./status.js";
import { flatten } from "flatten-anything";

async function monitorAndProcessTasks() {
  const intervalId = setInterval(async () => {
    const task = await checkForNewTask(); // Implement this function to check for new tasks
    if (task) {
      clearInterval(intervalId); // Stop checking while executing the task
      await updateTask(task._id, {
        executing: true,
        startedAt: new Date().toISOString(),
      });
      executeTask(task)
        .then(async (r) => {
          console.log('r:', r)
          if (
            r instanceof ProductLimitReachedStatus ||
            r instanceof TimeLimitReachedStatus
          ) {
            await updateTask(task._id, {
              completed: false,
              executing: false,
              errored: true,
              reason: r.name,
              result: r.result,
            });
          }
          if (r instanceof TaskCompletedStatus) {
            await updateTask(task._id, {
              completed: true,
              completedAt: new Date().toISOString(),
              executing: false,
              reason: r.name,
              result: r.result,
            });
          }
          const text = JSON.stringify(flatten(r), null, 2);
          const htmlBody = `\n<h1>Summary</h1>\n<pre>${text}</pre>\n\n`;
          await sendMail({
            subject: `Task: ${r.name} on ${os.hostname()}`,
            html: htmlBody,
          });
          monitorAndProcessTasks().then(); // Resume checking after task execution
        })
        .catch(async (error) => {
          console.log('error:', error)
          await updateTask(task._id, {
            completed: false,
            executing: false,
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
  if (type === "LOOKUP_PRODUTS") {
    return await match(task);
  }
}

async function checkForNewTask() {
  const task = await getNewTask();
  if (task) return task;
  return null;
}

monitorAndProcessTasks()
  .then()
  .catch((e) => {
    sendMail({
      subject: `Error: Queue failed on ${os.hostname()}`,
      html: e,
    }).then();
  });
