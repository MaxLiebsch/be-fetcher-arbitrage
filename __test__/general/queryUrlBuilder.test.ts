import { Query, queryURLBuilder } from '@dipmaxtech/clr-pkg';
import { defaultQuery, MAX_EBY_MULTIPLE } from '../../src/constants';
import { shops } from '../../src/shops';

describe('Query url builder', () => {
  it('should return total listing', () => {
    const e = Object.entries(shops).find(([k, s]) => s.d === 'ebay.de');

    if (!e) throw new Error('e missing')
    const [k, ebay] = e;
  const maxPrice = Math.ceil(100 * MAX_EBY_MULTIPLE).toString()
  const ean = "412342232222"
    const query: Query = {
      ...defaultQuery,
      product: {
        value: ean,
        key: ean,
        price: maxPrice,
      },
      category: 'total_listings',
    };
    const queryLink = queryURLBuilder(ebay.queryUrlSchema!, query).url;
    console.log('queryLink:', queryLink)
    expect(queryLink).toBe(
      `https://www.ebay.de/sch/i.html?_fsrp=1&rt=nc&_from=R40&LH_PrefLoc=3&LH_ItemCondition=3&_nkw=${ean}&_sacat=0&LH_BIN=1&_udhi=${maxPrice}`
    );
  });
});
