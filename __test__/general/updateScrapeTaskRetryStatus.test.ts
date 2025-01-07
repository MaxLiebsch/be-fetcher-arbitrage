import {
  MAX_TASK_RETRIES,
} from '../../src/constants';
import { updateScrapeTaskRetryStatus } from '../../src/util/updateScrapeTaskRetryStatus';
import { ScrapeShopTaskUpdate } from '../../src/types/tasks/Tasks';

describe('Update Scrape Task Retry Status', () => {
  const taskResult: any = {
    stats: {
      taskStats: { total: 10 },
      queueStats: { visitedPages: [] },
    },
    name: 'Test Task',
    message: 'Test Message',
  };

  const task: any = {
    limit: { pages: 5 },
    productLimit: 100,
    retry: 0,
    _id: 'taskId',
    executing: true,
    initialized: true,
    id: 'taskId',
    categories: ['category1'],
    shopDomain: 'shop.com',
  };

  const completionStatus: any = {
    taskCompleted: false,
    completionPercentage: 50,
  };

  const priority = 'high';
  const subject = 'Test Subject';

  it('should handle completed task', () => {
    completionStatus.taskCompleted = true;
    completionStatus.completionPercentage = 95;
    const update: ScrapeShopTaskUpdate = { executing: false, visitedPages: [] };
    updateScrapeTaskRetryStatus(
      task.retry,
      taskResult.stats.taskStats.total,
      completionStatus.taskCompleted,
      update,
      task.initialized
    );

    expect(update.completedAt).toBeTruthy();
  });

  it('should handle failed task with retry and total > 0', () => {
    completionStatus.taskCompleted = false;
    task.retry = 1;
    const update: ScrapeShopTaskUpdate = { executing: false, visitedPages: [] };
    updateScrapeTaskRetryStatus(
      task.retry,
      taskResult.stats.taskStats.total,
      completionStatus.taskCompleted,
      update,
      task.initialized
    );
    expect(taskResult.stats.taskStats.total).toBeGreaterThan(0);
    expect(update.completedAt).toBeTruthy();
    expect(update.retry).toBe(0);
  });

  it('should handle failed task with retry and total === 0', () => {
    completionStatus.taskCompleted = false;
    taskResult.stats.taskStats.total = 0;
    task.retry = 1;
    const update: ScrapeShopTaskUpdate = { executing: false, visitedPages: [] };
    updateScrapeTaskRetryStatus(
      task.retry,
      taskResult.stats.taskStats.total,
      completionStatus.taskCompleted,
      update,
      task.initialized
    );
    expect(update.retry).toBe(2);
    expect(update.completedAt).toBeFalsy();
  });

  it('should handle failed task with max retries', () => {
    completionStatus.taskCompleted = false;
    task.retry = MAX_TASK_RETRIES;

    const update: ScrapeShopTaskUpdate = { executing: false, visitedPages: [] };

    updateScrapeTaskRetryStatus(
      task.retry,
      taskResult.stats.taskStats.total,
      completionStatus.taskCompleted,
      update,
      task.initialized
    );

    expect(update.completedAt).toBeTruthy();
    expect(update.retry).toBe(0);
  });

  it('should handle failed, not initialized task with retry and total > 0', () => {
    completionStatus.taskCompleted = false;
    task.retry = 1;
    task.initialized = false;

    const update: ScrapeShopTaskUpdate = { executing: false, visitedPages: [] };

    updateScrapeTaskRetryStatus(
      task.retry,
      taskResult.stats.taskStats.total,
      completionStatus.taskCompleted,
      update,
      task.initialized
    );

    expect(update.completedAt).toBeFalsy();
    expect(update.retry).toBe(2);
  });

  it('should handle failed, not initialized task with retry and total === 0', () => {
    completionStatus.taskCompleted = false;
    taskResult.stats.taskStats.total = 0;
    task.retry = 1;
    task.initialized = false;

    const update: ScrapeShopTaskUpdate = { executing: false, visitedPages: [] };

    updateScrapeTaskRetryStatus(
      task.retry,
      taskResult.stats.taskStats.total,
      completionStatus.taskCompleted,
      update,
      task.initialized
    );

    expect(update.completedAt).toBeFalsy();
    expect(update.retry).toBe(2);
  });

  it('should handle failed, not initialized task with max retries and total > 0', () => {
    completionStatus.taskCompleted = false;
    taskResult.stats.taskStats.total = 10;
    task.retry = 2;
    task.initialized = false;

    const update: ScrapeShopTaskUpdate = { executing: false, visitedPages: [] };

    updateScrapeTaskRetryStatus(
      task.retry,
      taskResult.stats.taskStats.total,
      completionStatus.taskCompleted,
      update,
      task.initialized
    );

    expect(update.completedAt).toBeTruthy();
    expect(update.retry).toBe(0);
    expect(update.initialized).toBeTruthy();
  });
  
  it('should handle not initialized completed task with retry and total > 0', () => {
    completionStatus.taskCompleted = true;
    taskResult.stats.taskStats.total = 10;
    task.retry = 1;
    task.initialized = false;

    const update: ScrapeShopTaskUpdate = { executing: false, visitedPages: [] };

    updateScrapeTaskRetryStatus(
      task.retry,
      taskResult.stats.taskStats.total,
      completionStatus.taskCompleted,
      update,
      task.initialized
    );

    expect(update.completedAt).toBeTruthy();
    expect(update.retry).toBe(0);
    expect(update.initialized).toBeTruthy();
  });




});
