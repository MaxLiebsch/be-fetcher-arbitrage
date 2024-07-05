import {
  COMPLETE_FAILURE_THRESHOLD,
  COOLDOWN,
  MAX_TASK_RETRIES,
  SAVEGUARD_INCREASE_PAGE_LIMIT_RUNAWAY_THRESHOLD,
} from "../constants.js";
import { hostname } from "../services/db/mongo.js";
import { updateShopStats } from "../services/db/util/shops.js";
import { updateTask } from "../services/db/util/tasks.js";
import calculatePageLimit from "./calculatePageLimit.js";
import { getTaskSymbol } from "./getTaskSymbol.js";
import { handleTaskCompleted } from "./handleTaskComplete.js";
import { handleTaskFailed } from "./handleTaskFailed.js";
import isTaskComplete from "./isTaskComplete.js";

async function handleCrawlTask({
  taskResult,
  task,
  completionStatus,
  priority,
  subject,
}) {
  const { result, name, message } = taskResult;
  const { infos } = result;
  const { limit, productLimit, retry, _id, id, categories, shopDomain } = task;
  const { taskCompleted, completionPercentage } = completionStatus;
  if (taskCompleted) {
    await handleTaskCompleted(_id, infos);
  } else {
    subject = "🚱 " + subject + " " + completionPercentage;
    const update = {
      executing: false,
    };
    if (retry < MAX_TASK_RETRIES) {
      update["retry"] = retry + 1;
      update["completedAt"] = "";
    } else {
      update["completedAt"] = new Date().toISOString();
      update["retry"] = 0;
    }
    if (
      result.infos.total > COMPLETE_FAILURE_THRESHOLD &&
      limit.pages <= SAVEGUARD_INCREASE_PAGE_LIMIT_RUNAWAY_THRESHOLD
    ) {
      const newPageLimit = calculatePageLimit(
        limit.pages,
        productLimit,
        result.infos.total
      );
      update["limit"] = {
        ...limit,
        pages: newPageLimit,
      };
    }
    if (newRetry === MAX_TASK_RETRIES && result.infos.total > 0) {
      update["productLimit"] = result.infos.total;
    }
    await updateTask(_id, {
      $set: update,
      $pull: { lastCrawler: hostname },
    });
  }
  const emailBody = {
    shop: shopDomain,
    categories,
    name,
    ...result,
    message,
  };

  const text = JSON.stringify(emailBody, null, 2);
  const htmlBody = `\n<h1>Summary - ${id}</h1>\n<pre>${text}</pre>\n\n`;

  return { htmlBody, subject, priority };
}
async function handleCrawlEansTask({
  taskResult,
  task,
  completionStatus,
  priority,
  subject,
}) {
  const { result, name, message } = taskResult;
  const { infos } = result;
  const { taskCompleted, completionPercentage } = completionStatus;
  const { retry, _id, id } = task;

  if (taskCompleted) {
    await handleTaskCompleted(_id, infos);
  } else {
    subject = "🚱 " + subject + " " + completionPercentage;
    await handleTaskFailed(_id, retry);
  }

  const emailBody = {
    name,
    ...result,
    message,
  };

  const text = JSON.stringify(emailBody, null, 2);
  const htmlBody = `\n<h1>Summary ${id}</h1>\n<pre>${text}</pre>\n\n`;

  return { htmlBody, subject, priority };
}
async function handleLookupInfoTask({
  taskResult,
  task,
  completionStatus,
  priority,
  subject,
}) {
  const { result, name, message } = taskResult;
  const { infos } = result;
  const { retry, _id, id } = task;

  const { taskCompleted, completionPercentage } = completionStatus;
  if (taskCompleted) {
    await handleTaskCompleted(_id, infos);
  } else {
    subject = "🚱 " + subject + " " + completionPercentage;
    await handleTaskFailed(_id, retry);
  }

  const emailBody = {
    name,
    ...result,
    message,
  };
  const text = JSON.stringify(emailBody, null, 2);
  const htmlBody = `\n<h1>Summary ${id}</h1>\n<pre>${text}</pre>\n\n`;

  return { htmlBody, subject, priority };
}
async function handleMatchTask({
  taskResult,
  task,
  completionStatus,
  priority,
  subject,
}) {
  const { result, name, message } = taskResult;
  const { infos } = result;
  const { retry, _id, id, shopDomain } = task;
  const { taskCompleted, completionPercentage } = completionStatus;

  if (taskCompleted) {
    await handleTaskCompleted(_id, infos);
    await updateShopStats(shopDomain);
  } else {
    subject = "🚱 " + subject + " " + completionPercentage;
    await handleTaskFailed(_id, retry);
  }
  const emailBody = {
    name,
    ...result,
    message,
  };
  const text = JSON.stringify(emailBody, null, 2);
  const htmlBody = `\n<h1>Summary ${id}</h1>\n<pre>${text}</pre>\n\n`;

  return { htmlBody, subject, priority };
}
async function handleQueryEansOnEbyTask({
  taskResult,
  task,
  completionStatus,
  priority,
  subject,
}) {
  const { result, name, message } = taskResult;
  const { infos } = result;
  const { retry, _id, id } = task;
  const { taskCompleted, completionPercentage } = completionStatus;
  if (taskCompleted) {
    await handleTaskCompleted(_id, infos);
  } else {
    subject = "🚱 " + subject + " " + completionPercentage;
    await handleTaskFailed(_id, retry);
  }
  const emailBody = {
    name,
    ...result,
    message,
  };

  const text = JSON.stringify(emailBody, null, 2);
  const htmlBody = `\n<h1>Summary ${id}</h1>\n<pre>${text}</pre>\n\n`;

  return { htmlBody, subject, priority };
}
async function handleCrawlAznListingsTask({
  taskResult,
  task,
  completionStatus,
  priority,
  subject,
}) {
  const { result, name, message } = taskResult;
  const { infos } = result;
  const { retry, _id, id } = task;
  const { taskCompleted, completionPercentage } = completionStatus;
  if (taskCompleted) {
    await handleTaskCompleted(_id, infos);
  } else {
    subject = "🚱 " + subject + " " + completionPercentage;
    await handleTaskFailed(_id, retry);
  }

  const emailBody = {
    name,
    ...result,
    message,
  };

  const text = JSON.stringify(emailBody, null, 2);
  const htmlBody = `\n<h1>Summary ${id}</h1>\n<pre>${text}</pre>\n\n`;

  return { htmlBody, subject, priority };
}
async function handleCrawlEbyListingsTask({
  taskResult,
  task,
  completionStatus,
  priority,
  subject,
}) {
  const { result, name, message } = taskResult;
  const { infos } = result;
  const { retry, _id, id } = task;
  const { taskCompleted, completionPercentage } = completionStatus;
  if (taskCompleted) {
    await handleTaskCompleted(_id, infos);
  } else {
    subject = "🚱 " + subject + " " + completionPercentage;
    await handleTaskFailed(_id, retry);
  }

  const emailBody = {
    name,
    ...result,
    message,
  };

  const text = JSON.stringify(emailBody, null, 2);
  const htmlBody = `\n<h1>Summary ${id}</h1>\n<pre>${text}</pre>\n\n`;

  return { htmlBody, subject, priority };
}
async function handleScanTask({
  taskResult,
  task,
  completionStatus,
  priority,
  subject,
}) {
  const { result, name, message } = taskResult;
  const { retry, _id, id } = task;
  const { taskCompleted, completionPercentage } = completionStatus;
  if (taskCompleted) {
    const update = {
      completedAt: new Date().toISOString(),
      completed: true,
      executing: false,
      retry: 0,
    };
    await updateTask(_id, {
      $set: update,
      $pull: { lastCrawler: hostname },
    });
  } else {
    subject = "🚱 " + subject + " " + completionPercentage;
    await handleTaskFailed(_id, retry);
  }
  const emailBody = {
    name,
    ...result,
    message,
  };

  const text = JSON.stringify(emailBody, null, 2);
  const htmlBody = `\n<h1>Summary ${id}</h1>\n<pre>${text}</pre>\n\n`;

  return { htmlBody, subject, priority };
}
async function handleWholesaleTask({
  taskResult,
  task,
  completionStatus,
  priority,
  subject,
}) {
  const { result, name, message } = taskResult;
  const { retry, _id, id } = task;
  const { taskCompleted, completionPercentage } = completionStatus;
  if (taskCompleted) {
    const update = {
      completedAt: new Date().toISOString(),
      executing: false,
      retry: 0,
    };
    await updateTask(_id, {
      $set: update,
      $pull: { lastCrawler: hostname },
    });
  } else {
    subject = "🚱 " + subject + " " + completionPercentage;
    const coolDownFactor = process.env.DEBUG ? 1000 * 60 * 2 : COOLDOWN;
    const cooldown = new Date(Date.now() + coolDownFactor).toISOString(); // 30 min in future
    await handleTaskFailed(_id, retry);
  }
  const emailBody = {
    name,
    ...result,
    message,
  };

  const text = JSON.stringify(emailBody, null, 2);
  const htmlBody = `\n<h1>Summary ${id}</h1>\n<pre>${text}</pre>\n\n`;

  return { htmlBody, subject, priority };
}
async function handleLookupCategoryTask({
  taskResult,
  task,
  completionStatus,
  priority,
  subject,
}) {
  const { result, name, message } = taskResult;
  const { infos } = result;
  const { retry, _id, id } = task;
  const { taskCompleted, completionPercentage } = completionStatus;
  if (taskCompleted) {
    await handleTaskCompleted(_id, infos);
  } else {
    subject = "🚱 " + subject + " " + completionPercentage;
    await handleTaskFailed(_id, retry);
  }

  const emailBody = {
    name,
    ...result,
    message,
  };
  const text = JSON.stringify(emailBody, null, 2);
  const htmlBody = `\n<h1>Summary ${id}</h1>\n<pre>${text}</pre>\n\n`;

  return { htmlBody, subject, priority };
}
export async function handleTask(taskResult, task) {
  const { result } = taskResult;
  const { type, productLimit, id } = task;
  const subject = `🆗 ${getTaskSymbol(type)} ${hostname}: ${id}`;
  const completionStatus = isTaskComplete(type, result.infos, productLimit);
  const infos = {
    taskResult,
    task,
    subject,
    priority: completionStatus.taskCompleted ? "normal" : "high",
    completionStatus,
  };

  if (type === "CRAWL_SHOP") {
    return await handleCrawlTask(infos);
  }
  if (type === "WHOLESALE_SEARCH") {
    return await handleWholesaleTask(infos);
  }
  if (type === "SCAN_SHOP") {
    return await handleScanTask(infos);
  }
  if (type === "MATCH_PRODUCTS") {
    return await handleMatchTask(infos);
  }
  if (type === "CRAWL_AZN_LISTINGS") {
    return await handleCrawlAznListingsTask(infos);
  }
  if (type === "CRAWL_EBY_LISTINGS") {
    return await handleCrawlEbyListingsTask(infos);
  }
  if (type === "CRAWL_EAN") {
    return await handleCrawlEansTask(infos);
  }
  if (type === "LOOKUP_INFO") {
    return await handleLookupInfoTask(infos);
  }
  if (type === "QUERY_EANS_EBY") {
    return await handleQueryEansOnEbyTask(infos);
  }
  if (type === "LOOKUP_CATEGORY") {
    return await handleLookupCategoryTask(infos);
  }
}
