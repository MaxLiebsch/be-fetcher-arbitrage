import { findTasksQuery } from '../../src/db/util/queries.js';
import sinon from 'sinon';

describe('findTask', () => {
  let clock: sinon.SinonFakeTimers;
  beforeAll(() => {
    clock = sinon.useFakeTimers({
      now: new Date('2024-07-24T23:50:00Z').getTime(),
    });
  });

  test('findTask - prio queue', () => {
    const { prioQuery, query, fallbackQuery, update } = findTasksQuery();
    const or = prioQuery.$and[1].$or;
    let taskExists = false;
    if (or) {
      for (const x of or) {
        if(x.$and.some((x: any) => x.type === 'DAILY_SALES')){
            taskExists = true;
        }
      }
    }
    expect(taskExists).toBe(false);
  });
  test('findTask - prio queue 8am', () => {
    clock.restore();
    clock = sinon.useFakeTimers({
      now: new Date('2024-07-24T08:50:00Z').getTime(),
    });
    let taskExists = false;
    const { prioQuery, query, fallbackQuery, update } = findTasksQuery();
    const or = prioQuery.$and[1].$or;
    if (or) {
        for (const x of or) {
          if(x.$and.some((x: any) => x.type === 'DAILY_SALES')){
              taskExists = true;
          }
        }
      }
      expect(taskExists).toBe(true);
  });
  test('findTask - prio queue 20am1', () => {
    clock.restore();
    clock = sinon.useFakeTimers({
      now: new Date('2024-07-24T18:59:00Z').getTime(),
    });
    let taskExists = false;
    const { prioQuery, query, fallbackQuery, update } = findTasksQuery();
    const or = prioQuery.$and[1].$or;
    if (or) {
        for (const x of or) {
          if(x.$and.some((x: any) => x.type === 'DAILY_SALES')){
              taskExists = true;
          }
        }
      }
      expect(taskExists).toBe(true);
  });
});
