import { ObjectId } from 'mongodb';
import { scrapeShopTaskQueryFn } from '../../src/db/util/queries';
import { TASK_TYPES } from '../../src/util/taskTypes';

describe('scrapeShopTaskQueryFn', () => {
    it('should return the correct query for scraping shop tasks', () => {
        const start = '2023-01-01T00:00:00Z';
        const weekday = 1;

        const expectedQuery = [
            { type: TASK_TYPES.CRAWL_SHOP },
            { recurrent: { $eq: true } },
            { executing: { $eq: false } },
            { weekday: { $eq: weekday } },
            {
                $or: [{ completedAt: '' }, { completedAt: { $lt: start } }],
            },
        ];

        const result = scrapeShopTaskQueryFn(start, weekday);
        console.log('result:', JSON.stringify(result,null,2))
        expect(result).toEqual(expectedQuery);
    });
});