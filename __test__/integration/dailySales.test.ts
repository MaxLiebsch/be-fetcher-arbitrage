import { LocalLogger, ObjectId } from '@dipmaxtech/clr-pkg';
import { dailySales } from '../../src/services/dailySales';
import { DailySalesTask } from '../../src/types/tasks/DailySalesTask';
import { log, setTaskLogger } from '../../src/util/logger';
import { describe, test } from '@jest/globals';
import { deleteAllProducts } from '../../src/db/util/crudProducts';
import { findTask } from '../../src/db/util/tasks';
import { updateShops } from '../../src/db/util/shops';
import { shops } from '../../src/shops';
import { hostname } from '../../src/db/mongo';
import { exec } from 'child_process';

describe('Daily Sales', () => {
  beforeAll(async () => {
    await deleteAllProducts('sales');
    await updateShops(shops);
  }, 100000);

  test('Daily Sales listings', async () => {
    const logger = new LocalLogger().createLogger('DAILY_SALES');
    setTaskLogger(logger, 'TASK_LOGGER');

    const task = await findTask({ id: 'daily_sales_idealo.de' });

    if (!task) {
      throw new Error('Task not found');
    }

    // task.productLimit = 40;

    const infos = await dailySales(task as unknown as DailySalesTask);
    console.log(JSON.stringify(infos, null, 2));
  }, 1000000);
});

const errorHandler = (err: any, origin: any) => {
  const IsTargetError = `${err}`.includes('Target closed');
  const IsSessionError = `${err}`.includes('Session closed');
  const IsNavigationDetachedError = `${err}`.includes(
    'Navigating frame was detached',
  );
  const IsProtocolError = `${err}`.includes('ProtocolError');

  let type = 'unhandledException';
  if (IsTargetError) {
    type = 'TargetClosed';
  } else if (IsSessionError) {
    type = 'SessionClosed';
  } else if (IsNavigationDetachedError) {
    type = 'NavigationDetached';
  } else if (IsProtocolError) {
    type = 'ProtocolError';
  }
  log(`Error: ${type} on ${hostname} taskId:  error: ${err?.message}`);

  // Run pkill -f chrome when an error occurs
  exec('pkill -f chrome', (error, stdout, stderr) => {
    if (error) {
      log(`Error executing pkill: ${error.message}`);
      return;
    }
    if (stderr) {
      log(`pkill stderr: ${stderr}`);
      return;
    }
    log(`pkill stdout: ${stdout}`);
  });

  if (type === 'unhandledException') {
    throw err; //unhandledException:  Re-throw all other errors
  } else {
    return;
  }
};
process.on('unhandledRejection', errorHandler);

process.on('uncaughtException', errorHandler);
