import { sleep } from "@dipmaxtech/clr-pkg";
import { TaskCompletedStatus, TimeLimitReachedStatus } from "../status.js";
import { MATCH_TIME_LIMIT } from "../constants.js";

export const checkProgress = async (args) => {
  const { queue, infos, startTime, productLimit } = args;
  const endTime = Date.now();
  const elapsedTime = (endTime - startTime) / 1000 / 60 / 60;

  infos["elapsedTime"] = `${elapsedTime.toFixed(2)} h`;
  console.log("checkProgress total: ", infos.total, "Expected: ", productLimit);

  if (queue instanceof Array) {
    let status = "";
    const isDone = queue.every((q) => q.workload() === 0);
    if (infos.total === productLimit) {
      status = "PRODUCT_LIMIT_REACHED";
      const tasks = await Promise.all(
        queue.map((q) => q.clearQueue(status, infos))
      );
      const task = {
        ...tasks[0],
        others: tasks.slice(1).reduce((acc, task, i) => {
          acc[`task${i + 1}`] = task;
          return acc;
        }, {}),
      };
      throw new TaskCompletedStatus("", task, {
        infos,
        statistics: task.statistics,
      });
    }
    if (elapsedTime > MATCH_TIME_LIMIT) {
      status = "TIME_LIMIT_REACHED";
      const tasks = await Promise.all(
        queue.map((q) => q.clearQueue(status, infos))
      );
      const task = {
        ...tasks[0],
        others: tasks.slice(1).reduce((acc, task, i) => {
          acc[`task${i + 1}`] = task;
          return acc;
        }, {}),
      };
      throw new TaskCompletedStatus("", task, {
        infos,
        statistics: task.statistics,
      });
    }
    if (isDone) {
      status = "TASK_COMPLETED";
      await sleep(15000);
      const tasks = await Promise.all(
        queue.map((q) => q.clearQueue(status, infos))
      );
      const task = {
        ...tasks[0],
        others: tasks.slice(1).reduce((acc, task, i) => {
          acc[`task${i + 1}`] = task;
          return acc;
        }, {}),
      };
      throw new TaskCompletedStatus("", task, {
        infos,
        statistics: task.statistics,
      });
    }
  } else {
    if (infos.total === productLimit) {
      const task = await queue.clearQueue("PRODUCT_LIMIT_REACHED", infos);
      throw new TaskCompletedStatus("PRODUCT_LIMIT_REACHED", task, {
        infos,
        statistics: task.statistics,
      });
    }
    if (elapsedTime > MATCH_TIME_LIMIT) {
      const task = await queue.clearQueue("TIME_LIMIT_REACHED", infos);
      throw new TimeLimitReachedStatus("", task, {
        infos,
        statistics: task.statistics,
      });
    }
    if (queue.workload() === 0) {
      const task = await queue.clearQueue("TASK_COMPLETED", infos);
      throw new TaskCompletedStatus("", task, {
        infos,
        statistics: task.statistics,
      });
    }
  }
};
