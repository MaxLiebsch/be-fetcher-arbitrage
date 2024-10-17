import {
  CrawlerQueue,
  QueryQueue,
  ScanQueue,
  sleep,
  TaskTypes,
} from "@dipmaxtech/clr-pkg";
import { TaskCompletedStatus } from "../status.js";
import { MATCH_TIME_LIMIT, STANDARD_SETTLING_TIME } from "../constants.js";
import { getElapsedTime } from "./dates.js";
import { TASK_RESULT } from "./TaskResult.js";
import { Tasks } from "../types/tasks/Tasks.js";
import { TaskStats } from "../types/taskStats/TasksStats.js";
import { combineQueueStats } from "./combineQueueStats.js";
import { TaskResultEvent } from "../types/tasks/TaskResult.js";
import { log } from "./logger.js";

interface CheckProgressArgs {
  queue: QueryQueue[] | QueryQueue | CrawlerQueue | ScanQueue;
  infos: TaskStats;
  task: Tasks;
  startTime: number;
  productLimit: number;
}

const handleArrayOfQueues = async (
  queues: QueryQueue[],
  taskStats: TaskStats,
  status: TaskResultEvent
) => {
  const queueStats = await Promise.all(
    queues.map(async (q) => {
      await q.clearQueue(status, taskStats);
      return q.queueStats;
    })
  );
  return combineQueueStats(queueStats);
};

const handleSingleQueue = async (
  queue: QueryQueue | CrawlerQueue | ScanQueue,
  taskStats: TaskStats,
  status: string
) => {
  return await queue.clearQueue(status, taskStats);
};

// Tasks that should be considered successful before reaching the product limit
const preSuccessTasks: TaskTypes[] = ["DAILY_SALES", "CRAWL_SHOP"];

export const checkProgress = async ({
  queue,
  infos: taskStats,
  startTime,
  task,
  productLimit,
}: CheckProgressArgs): Promise<TaskCompletedStatus | undefined> => {
  const { elapsedTime, elapsedTimeStr } = getElapsedTime(startTime);
  let status: TaskResultEvent = TASK_RESULT.TASK_COMPLETED;

  taskStats["elapsedTime"] = elapsedTimeStr;

  const { total } = taskStats;

  log(
    `${task.type} - checking progress total: ${total} Expected: ${productLimit}`
  );

  if (queue instanceof Array) {
    const isDone = queue.every((q) => q.workload() === 0);
    if (total >= productLimit) {
      await sleep(STANDARD_SETTLING_TIME);
      log(`MultiQueue: ${task.type} - Product limit reached`);
      status = TASK_RESULT.PRODUCT_LIMIT_REACHED;
      const combinedQueueStats = await handleArrayOfQueues(
        queue,
        taskStats,
        status
      );
      return new TaskCompletedStatus(status, task, {
        taskStats,
        queueStats: combinedQueueStats,
      });
    }
    if (elapsedTime > MATCH_TIME_LIMIT) {
      log(`MultiQueue: ${task.type} - Time limit reached`);
      status = TASK_RESULT.TIME_LIMIT_REACHED;
      const combinedQueueStats = await handleArrayOfQueues(
        queue,
        taskStats,
        status
      );
      return new TaskCompletedStatus(status, task, {
        taskStats,
        queueStats: combinedQueueStats,
      });
    }
    if (
      isDone &&
      (total >= productLimit || preSuccessTasks.includes(task.type))
    ) {
      log(`MultiQueue: ${task.type} - Task completed`);
      status = TASK_RESULT.TASK_COMPLETED;
      await sleep(STANDARD_SETTLING_TIME);
      const combinedQueueStats = await handleArrayOfQueues(
        queue,
        taskStats,
        status
      );
      return new TaskCompletedStatus(status, task, {
        taskStats,
        queueStats: combinedQueueStats,
      });
    }
  } else {
    if (total >= productLimit) {
      log(`Single Queue: ${task.type} - Product limit reached`);
      await sleep(STANDARD_SETTLING_TIME);
      status = TASK_RESULT.PRODUCT_LIMIT_REACHED;
      await handleSingleQueue(queue, taskStats, status);

      return new TaskCompletedStatus(status, task, {
        taskStats,
        queueStats: queue.queueStats,
      });
    }
    if (elapsedTime > MATCH_TIME_LIMIT) {
      log(`Single Queue: ${task.type} - Time limit reached`);
      status = TASK_RESULT.TIME_LIMIT_REACHED;
      await handleSingleQueue(queue, taskStats, status);

      return new TaskCompletedStatus(status, task, {
        taskStats,
        queueStats: queue.queueStats,
      });
    }

    if (
      queue.workload() === 0 &&
      (total >= productLimit || preSuccessTasks.includes(task.type))
    ) {
      await sleep(STANDARD_SETTLING_TIME);
      log(`Single Queue: ${task.type} - Task completed`);
      status = TASK_RESULT.TASK_COMPLETED;
      await handleSingleQueue(queue, taskStats, status);

      return new TaskCompletedStatus(status, task, {
        taskStats,
        queueStats: queue.queueStats,
      });
    }
  }
  return undefined;
};
