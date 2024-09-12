import { CrawlerQueue, QueryQueue, sleep } from "@dipmaxtech/clr-pkg";
import { TaskCompletedStatus } from "../status.js";
import { MATCH_TIME_LIMIT } from "../constants.js";
import { getElapsedTime } from "./dates.js";
import { TASK_RESULT } from "./TaskResult.js";
import { Tasks } from "../types/tasks/Tasks.js";
import { TaskStats } from "../types/taskStats/TasksStats.js";
import { combineQueueStats } from "./combineQueueStats.js";
import { TaskResultEvent } from "../types/tasks/TaskResult.js";

interface CheckProgressArgs {
  queue: QueryQueue[] | QueryQueue | CrawlerQueue;
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
  queue: QueryQueue | CrawlerQueue,
  taskStats: TaskStats,
  status: string
) => {
  return await queue.clearQueue(status, taskStats);
};

export const checkProgress = async ({
  queue,
  infos: taskStats,
  startTime,
  task,
  productLimit,
}: CheckProgressArgs): Promise<TaskCompletedStatus| undefined> => {
  const { elapsedTime, elapsedTimeStr } = getElapsedTime(startTime);
  let status: TaskResultEvent = TASK_RESULT.TASK_COMPLETED;

  taskStats["elapsedTime"] = elapsedTimeStr;

  const { total } = taskStats;

  console.log("checkProgress total: ", total, "Expected: ", productLimit);

  if (queue instanceof Array) {
    const isDone = queue.every((q) => q.workload() === 0);
    if (total === productLimit) {
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
    if (isDone) {
      status = TASK_RESULT.TASK_COMPLETED;
      await sleep(15000);
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
    if (total === productLimit) {
      status = TASK_RESULT.PRODUCT_LIMIT_REACHED;
      await handleSingleQueue(queue, taskStats, status);

      return new TaskCompletedStatus(status, task, {
        taskStats,
        queueStats: queue.queueStats,
      });
    }
    if (elapsedTime > MATCH_TIME_LIMIT) {
      status = TASK_RESULT.TIME_LIMIT_REACHED;
      await handleSingleQueue(queue, taskStats, status);

      return new TaskCompletedStatus(status, task, {
        taskStats,
        queueStats: queue.queueStats,
      });
    }
    if (queue.workload() === 0) {
      status = TASK_RESULT.TASK_COMPLETED;
      await handleSingleQueue(queue, taskStats, status);

      return new TaskCompletedStatus(status, task, {
        taskStats,
        queueStats: queue.queueStats,
      });
    }
  }
};
