import { QueryQueue } from "@dipmaxtech/clr-pkg";

export const getMaxLoadQueue = (queues: QueryQueue[]) => {
  const queueLoad = queues.map((queue) => queue.workload());
  const maxQueueLoad = Math.max(...queueLoad);
  const index = queueLoad.indexOf(maxQueueLoad);
  return queues[index];
};
