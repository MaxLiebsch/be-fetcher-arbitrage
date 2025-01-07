import { MAX_TASK_RETRIES } from '../constants.js';
import { ScrapeShopTaskUpdate } from '../types/tasks/Tasks.js';

export function updateScrapeTaskRetryStatus(
  retry: number,
  total: number,
  taskCompleted: boolean,
  update: ScrapeShopTaskUpdate,
  initialized: boolean
) {
  if (
    (retry < MAX_TASK_RETRIES && total === 0) ||
    (retry < MAX_TASK_RETRIES && !taskCompleted && !initialized)
  ) {
    update['retry'] = retry + 1;
    update['completedAt'] = '';
  } else {
    update['completedAt'] = new Date().toISOString();
    update['retry'] = 0;
    
    if (!initialized) {
      update['initialized'] = true;
    }
  }
}
