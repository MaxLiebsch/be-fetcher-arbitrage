import { describe, expect, test, beforeAll } from '@jest/globals';
import { setTaskLogger } from '../../src/util/logger';
import { LocalLogger } from '@dipmaxtech/clr-pkg';
import scrapeShop from '../../src/services/scrapeShop';
import { sub } from 'date-fns';
import { ScrapeShopTask } from '../../src/types/tasks/Tasks';
import {
  deleteTasks,
  findTask,
  getTasks,
  insertTasks,
} from '../../src/db/util/tasks';
import { updateShops } from '../../src/db/util/shops';
import { shops } from '../../src/shops';

const today = new Date();
const productLimit = 150;
const yesterday = sub(today, { days: 1 });

describe('crawlproducts', () => {
  beforeAll(async () => {
    await updateShops(shops);
  });
  test('Scrape shop', async () => {
    const task = (await findTask({
      id: process.argv[1],
      
    })) as ScrapeShopTask;
    if (!task) {
      console.log('Task not found');
      throw new Error('Task not found');
    }
    task.weekday = today.getDay();
    task.startedAt = yesterday.toISOString();
    task.completedAt = yesterday.toISOString();
    task.productLimit = productLimit;
    const logger = new LocalLogger().createLogger('CRAWL_SHOP');
    setTaskLogger(logger, 'TASK_LOGGER');
    ``;

    const infos = await scrapeShop(task as unknown as ScrapeShopTask);
    console.log(JSON.stringify(infos, null, 2));
  }, 1000000);

  // afterAll(async () => {
  //   await deleteTasks();
  // });
});
