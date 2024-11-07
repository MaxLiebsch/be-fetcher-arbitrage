import { beforeAll, describe, expect, test } from '@jest/globals';
import { findProducts } from '../../src/db/util/crudProducts';
import { calculateAznProvision } from '@dipmaxtech/clr-pkg';
describe('test Provision', () => {
  test('test Provision', async () => {
    const products = await findProducts(
      {
        $and: [
          { 'costs.prvsn': { $exists: true, $gt: 0 } },
          { 'costs.azn': { $exists: true } },
          { a_mrgn: { $gt: 0 } },
        ],
      },
      20,
      2
    );
    products.forEach((ex) => {
      console.log(ex.asin, 'CostsProvison', ex.costs?.prvsn);
      console.log(
        'calculateAznProvision:',
        calculateAznProvision(ex.costs!.azn, ex.a_prc!)
      );
      expect(ex.costs?.prvsn).toBe(
        calculateAznProvision(ex.costs!.azn, ex.a_prc!)
      );
    });
  });
});
