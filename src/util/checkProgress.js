import { sleep } from "@dipmaxtech/clr-pkg";
import { TaskCompletedStatus, TimeLimitReachedStatus } from "../status.js";
import { MATCH_TIME_LIMIT } from "../constants.js";

export const checkProgress = async (args) => {
  const { queue, infos, startTime, productLimit } = args;
  const endTime = Date.now();
  const elapsedTime = (endTime - startTime) / 1000 / 60 / 60;

  infos["elapsedTime"] = `${elapsedTime.toFixed(2)} h`;

  if (infos.total >= productLimit) {
    const task = await queue.clearQueue("PRODUCT_LIMIT_REACHED", infos);
    throw new TaskCompletedStatus("PRODUCT_LIMIT_REACHED", task, {
      infos,
      ...task.statistics,
    });
  }
  if (elapsedTime > MATCH_TIME_LIMIT) {
    const task = await queue.clearQueue("TIME_LIMIT_REACHED", infos);
    throw new TimeLimitReachedStatus("", task, {
      infos,
      ...task.statistics,
    });
  }
  if (queue.workload() === 0) {
    await sleep(15000);
    const task = await queue.clearQueue("TASK_COMPLETED", infos);
    throw new TaskCompletedStatus("", task, {
      infos,
      ...task.statistics,
    });
  }
};
