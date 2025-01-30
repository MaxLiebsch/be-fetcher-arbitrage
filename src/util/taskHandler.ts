import {
  COOLDOWN,
  DAILY_SALES_COOLDOWN,
  MAX_TASK_RETRIES,
  SCRAPE_SHOP_COOLDOWN,
} from '../constants.js';
import { hostname } from '../db/mongo.js';
import { updateTask } from '../db/util/tasks.js';
import { getTaskSymbol } from './getTaskSymbol.js';
import { handleTaskCompleted } from './handleTaskComplete.js';
import { handleTaskFailed } from './handleTaskFailed.js';
import isTaskComplete from './isTaskComplete.js';
import { TASK_TYPES } from './taskTypes.js';
import {
  MatchProductsTask,
  ScrapeShopTaskUpdate,
} from '../types/tasks/Tasks.js';
import { TaskCompletedStatus } from '../status.js';
import {
  CrawlEansTaskProps,
  DailySalesTaskProps,
  LookupCategoryTaskProps,
  LookupInfoTaskProps,
  MatchProductsTaskProps,
  NegAznDealTaskProps,
  NegEbyDealTaskProps,
  QueryEansOnEbyTaskProps,
  ScanTaskProps,
  ScrapeShopTaskProps,
  WholeSaleTaskProps,
} from '../types/handleTaskProps/HandleTaskProps.js';
import { updateScrapeTaskRetryStatus } from './updateScrapeTaskRetryStatus.js';
import { updateScrapeTaskPageLimit } from './updateScrapeTaskPageLimit.js';

async function handleDailySalesTask({
  taskResult,
  task,
  completionStatus,
  priority,
  subject,
}: DailySalesTaskProps) {
  const { stats, name, message } = taskResult;
  const { taskStats, queueStats } = stats;
  const { total } = taskStats;
  const { browserConfig, _id, id, categories, shopDomain, retry } = task;
  const { limit } = browserConfig.crawlShop;
  const { taskCompleted, completionPercentage } = completionStatus;
  if (taskCompleted) {
    subject += ' ' + taskStats.total;
    await handleTaskCompleted(_id, taskStats, {
      executing: false,
      lastTotal: taskStats.total,
    });
  } else {
    subject = '🚱 ' + subject + ' ' + completionPercentage;
    const update = {
      executing: false,
      lastTotal: total,
      cooldown: new Date(Date.now() + DAILY_SALES_COOLDOWN).toISOString(), //
      visitedPages: queueStats?.visitedPages || [],
    };
    updateScrapeTaskRetryStatus(retry, total, taskCompleted, update, true);
    await updateTask(_id, {
      $set: update,
      $pull: { lastCrawler: hostname },
    });
  }
  const emailBody = {
    shop: shopDomain,
    categories,
    name,
    ...stats,
    message,
  };

  const text = JSON.stringify(emailBody, null, 2);
  const htmlBody = `\n<h1>Summary - ${id}</h1>\n<pre>${text}</pre>\n\n`;

  return { htmlBody, subject, priority };
}
export async function handleScrapeTask({
  taskResult,
  task,
  completionStatus,
  priority,
  subject,
}: ScrapeShopTaskProps) {
  const { stats, name, message } = taskResult;
  const { taskStats, queueStats } = stats;
  const { total } = taskStats;
  const {
    limit,
    productLimit,
    retry,
    _id,
    id,
    categories,
    shopDomain,
    initialized,
  } = task;
  const { taskCompleted, completionPercentage } = completionStatus;
  if (taskCompleted) {
    subject += ' ' + total;
    await handleTaskCompleted(_id, taskStats, {
      executing: false,
      lastTotal: total,
    });
  } else {
    subject =
      `${initialized ? '' : 'Onboarding'} 🚱 ` +
      subject +
      ' ' +
      completionPercentage;
    const update: ScrapeShopTaskUpdate = {
      executing: false,
      lastTotal: total,
      visitedPages: queueStats.visitedPages,
    };
    update['cooldown'] = new Date(
      Date.now() + SCRAPE_SHOP_COOLDOWN
    ).toISOString(); // four hours in future

    updateScrapeTaskRetryStatus(
      retry,
      total,
      taskCompleted,
      update,
      Boolean(initialized)
    );
    updateScrapeTaskPageLimit(total, limit, productLimit, update);

    if (retry === MAX_TASK_RETRIES && total > 0) {
      update['productLimit'] = total;
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
    ...stats,
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
}: CrawlEansTaskProps) {
  const { stats, name, message } = taskResult;
  const { taskStats } = stats;
  const { taskCompleted, completionPercentage } = completionStatus;
  const { retry, _id, id } = task;

  if (taskCompleted) {
    await handleTaskCompleted(_id, taskStats);
  } else {
    subject = '🚱 ' + subject + ' ' + completionPercentage;
    await handleTaskFailed(_id, retry);
  }

  const emailBody = {
    name,
    ...stats,
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
}: LookupInfoTaskProps) {
  const { stats, name, message } = taskResult;
  const { taskStats } = stats;
  const { retry, _id, id } = task;

  const { taskCompleted, completionPercentage } = completionStatus;
  if (taskCompleted) {
    await handleTaskCompleted(_id, taskStats);
  } else {
    subject = '🚱 ' + subject + ' ' + completionPercentage;
    await handleTaskFailed(_id, retry);
  }

  const emailBody = {
    name,
    ...stats,
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
}: MatchProductsTaskProps) {
  const { stats, name, message } = taskResult;
  const { taskStats } = stats;
  const { retry, _id, id, shopDomain } = task as MatchProductsTask;
  const { taskCompleted, completionPercentage } = completionStatus;

  if (taskCompleted) {
    await handleTaskCompleted(_id, taskStats);
  } else {
    subject = '🚱 ' + subject + ' ' + completionPercentage;
    await handleTaskFailed(_id, retry);
  }
  const emailBody = {
    name,
    ...stats,
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
}: QueryEansOnEbyTaskProps) {
  const { stats, name, message } = taskResult;
  const { taskStats } = stats;
  const { retry, _id, id } = task;
  const { taskCompleted, completionPercentage } = completionStatus;
  if (taskCompleted) {
    await handleTaskCompleted(_id, taskStats);
  } else {
    subject = '🚱 ' + subject + ' ' + completionPercentage;
    await handleTaskFailed(_id, retry);
  }
  const emailBody = {
    name,
    ...stats,
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
}: NegAznDealTaskProps) {
  const { stats, name, message } = taskResult;
  const { taskStats } = stats;
  const { retry, _id, id } = task;
  const { taskCompleted, completionPercentage } = completionStatus;
  if (taskCompleted) {
    await handleTaskCompleted(_id, taskStats);
  } else {
    subject = '🚱 ' + subject + ' ' + completionPercentage;
    await handleTaskFailed(_id, retry);
  }

  const emailBody = {
    name,
    ...stats,
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
}: NegEbyDealTaskProps) {
  const { stats, name, message } = taskResult;
  const { taskStats } = stats;
  const { retry, _id, id } = task;
  const { taskCompleted, completionPercentage } = completionStatus;
  if (taskCompleted) {
    await handleTaskCompleted(_id, taskStats);
  } else {
    subject = '🚱 ' + subject + ' ' + completionPercentage;
    await handleTaskFailed(_id, retry);
  }

  const emailBody = {
    name,
    ...stats,
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
}: ScanTaskProps) {
  const { stats, name, message } = taskResult;
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
    subject = '🚱 ' + subject + ' ' + completionPercentage;
    await handleTaskFailed(_id, retry);
  }
  const emailBody = {
    name,
    ...stats,
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
}: WholeSaleTaskProps) {
  const { stats, name, message } = taskResult;
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
    subject = '🚱 ' + subject + ' ' + completionPercentage;
    const coolDownFactor = process.env.DEBUG ? 1000 * 60 * 2 : COOLDOWN;
    const cooldown = new Date(Date.now() + coolDownFactor).toISOString(); // 30 min in future
    await handleTaskFailed(_id, retry);
  }
  const emailBody = {
    name,
    ...stats,
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
}: LookupCategoryTaskProps) {
  const { stats, name, message } = taskResult;
  const { taskStats } = stats;
  const { retry, _id, id } = task;
  const { taskCompleted, completionPercentage } = completionStatus;
  if (taskCompleted) {
    await handleTaskCompleted(_id, taskStats);
  } else {
    subject = '🚱 ' + subject + ' ' + completionPercentage;
    await handleTaskFailed(_id, retry);
  }

  const emailBody = {
    name,
    ...stats,
    message,
  };
  const text = JSON.stringify(emailBody, null, 2);
  const htmlBody = `\n<h1>Summary ${id}</h1>\n<pre>${text}</pre>\n\n`;

  return { htmlBody, subject, priority };
}

export async function handleTask(taskResult: TaskCompletedStatus, task: any) {
  const { taskStats } = taskResult.stats;
  const { type, productLimit, id } = task;
  const subject = `🆗 ${getTaskSymbol(type)} ${hostname}: ${id}`;
  const completionStatus = isTaskComplete(type, taskStats, productLimit);

  const infos = {
    taskResult,
    task,
    subject,
    priority: completionStatus.taskCompleted ? 'normal' : 'high',
    completionStatus,
  };

  if (type === TASK_TYPES.DAILY_SALES) {
    return await handleDailySalesTask(infos);
  }
  if (type === TASK_TYPES.CRAWL_SHOP) {
    return await handleScrapeTask(infos);
  }
  if (type === TASK_TYPES.WHOLESALE_SEARCH) {
    return await handleWholesaleTask(infos);
  }
  if (type === TASK_TYPES.WHOLESALE_EBY_SEARCH) {
    return await handleWholesaleTask(infos);
  }
  if (type === TASK_TYPES.SCAN_SHOP) {
    return await handleScanTask(infos);
  }
  if (type === TASK_TYPES.MATCH_PRODUCTS) {
    return await handleMatchTask(infos);
  }
  if (type === TASK_TYPES.DEALS_ON_AZN) {
    return await handleCrawlAznListingsTask(infos);
  }
  if (type === TASK_TYPES.DEALS_ON_EBY) {
    return await handleCrawlEbyListingsTask(infos);
  }
  if (type === TASK_TYPES.NEG_AZN_DEALS) {
    return await handleCrawlAznListingsTask(infos);
  }
  if (type === TASK_TYPES.NEG_EBY_DEALS) {
    return await handleCrawlEbyListingsTask(infos);
  }
  if (type === TASK_TYPES.CRAWL_EAN) {
    return await handleCrawlEansTask(infos);
  }
  if (type === TASK_TYPES.LOOKUP_INFO) {
    return await handleLookupInfoTask(infos);
  }
  if (type === TASK_TYPES.QUERY_EANS_EBY) {
    return await handleQueryEansOnEbyTask(infos);
  }
  if (type === TASK_TYPES.LOOKUP_CATEGORY) {
    return await handleLookupCategoryTask(infos);
  }

  throw new Error('Task type not found');
}
