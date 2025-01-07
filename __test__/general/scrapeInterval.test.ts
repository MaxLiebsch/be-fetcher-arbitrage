import { parseISO, startOfDay, subWeeks } from 'date-fns';
import { SCRAPE_SHOP_INTERVAL } from '../../src/constants.js';
import * as sinon from 'sinon';

let clock: sinon.SinonFakeTimers;

describe('Scrape Shop Interval', () => {
  const lastCompletedAt = '2025-01-07T01:21:42.909Z';
  const lastCompletedAtTime = new Date(lastCompletedAt).getTime()
  beforeEach(() => {
    clock = sinon.useFakeTimers({
      now: lastCompletedAtTime,
    });
  });
  it('Scrape task got completed more then 4 Weeks ago. Should be scanned', () => {  
    const inFourWeeks = parseISO('2025-02-04T01:21:42.959Z').getTime()
    clock.tick(inFourWeeks - lastCompletedAtTime);
    const today = new Date();
    console.log('today:', today)
    const pastCompletedAt = parseISO(lastCompletedAt);
    const scrapeShopInterval = subWeeks(today, SCRAPE_SHOP_INTERVAL);
    expect(pastCompletedAt.getTime()).toBeLessThan(scrapeShopInterval.getTime());
    clock.restore();
  });
  it('Scrape task got completed within the last 4 Weeks.', () => {
    const inFourWeeks = parseISO('2025-01-28T01:21:42.959Z').getTime()
    clock.tick(inFourWeeks - lastCompletedAtTime);
    const today = new Date();
    console.log('today:', today)
    const pastCompletedAt = parseISO(lastCompletedAt);
    const scrapeShopInterval = subWeeks(today, SCRAPE_SHOP_INTERVAL);
    expect(pastCompletedAt.getTime()).toBeGreaterThan(scrapeShopInterval.getTime());
  });
});
