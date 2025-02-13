import { describe, test, beforeAll } from '@jest/globals';
import { setTaskLogger } from '../../src/util/logger';
import { LocalLogger, scanShop } from '@dipmaxtech/clr-pkg';
import { sub } from 'date-fns';
import { ScanTask, ScrapeShopTask } from '../../src/types/tasks/Tasks';
import { findTask } from '../../src/db/util/tasks';
import { updateShops } from '../../src/db/util/shops';
import { shops } from '../../src/shops';
import scan from '../../src/services/scan';

const today = new Date();
const productLimit = 150;
const yesterday = sub(today, { days: 1 });
const args = process.argv.slice(2).map((arg) => arg.replace('--', ''));

describe('scan shop', () => {
  beforeAll(async () => {
    await updateShops(shops);
  });
  test('scan shop', async () => {
    const task = (await findTask({
      type: 'SCAN_SHOP',
      shopDomain:args[1],
    })) as ScrapeShopTask;
    if (!task) {
      console.log('Task not found');
      throw new Error('Task not found');
    }
    const logger = new LocalLogger().createLogger('SCAN_SHOP');
    setTaskLogger(logger, 'TASK_LOGGER');

    const infos = await scan(task as unknown as ScanTask);
    console.log(JSON.stringify(infos, null, 2));
  }, 1000000);

});
