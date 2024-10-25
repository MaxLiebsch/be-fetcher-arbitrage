import { QueryQueue } from '@dipmaxtech/clr-pkg';
import { MultiShopMultiQueueTask } from '../types/tasks/Tasks.js';
import { CONCURRENCY, proxyAuth } from '../constants.js';
import { getMaxLoadQueue } from './getMaxLoadQueue.js';
import { log } from './logger.js';

export async function multiQueueInitializer(
  task: MultiShopMultiQueueTask,
  queuesWithId: { [key: string]: QueryQueue },
  queues: QueryQueue[],
  eventEmitter: any,
) {
  const { browserConcurrency } = task;
  return Promise.all(
    Array.from({ length: browserConcurrency ?? 1 }, (v, k) => k + 1).map(
      async () => {
        const queue = new QueryQueue(
          task?.concurrency ? task.concurrency : CONCURRENCY,
          proxyAuth,
          task,
        );
        queue.total = 1;
        queuesWithId[queue.queueId] = queue;
        queues.push(queue);
        eventEmitter.on(
          `${queue.queueId}-finished`,
          async function wholesaleCallback({ queueId }: { queueId: string }) {
            log(`Emitter: Queue completed ${queueId}`);
            const maxQueue = getMaxLoadQueue(queues);
            const tasks = maxQueue.pullTasksFromQueue();
            if (tasks) {
              log(
                `Adding ${tasks.length} tasks from ${maxQueue.queueId} to ${queueId}`,
              );
              queuesWithId[queueId].addTasksToQueue(tasks);
            } else {
              log('No more tasks to distribute. Closing ' + queueId);
              await queuesWithId[queueId].disconnect(true);
            }
          },
        );
        return queue.connect();
      },
    ),
  );
}
