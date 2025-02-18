import { countPendingProductsForLookupCategoryQuery } from '../../../src/db/util/queries.js';

describe('lookup category', () => {
  it('should lookup category', async () => {
    const result = countPendingProductsForLookupCategoryQuery('idealo.de');
    console.log('result:', JSON.stringify(result, null,2))
    expect(result).toBeDefined();
  });
});
