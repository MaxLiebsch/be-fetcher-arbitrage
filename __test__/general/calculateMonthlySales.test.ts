import { describe, expect, test, beforeAll } from '@jest/globals';
import { calculateMonthlySales } from '@dipmaxtech/clr-pkg';
import { getProductsCol } from '../../src/db/mongo';

describe('Calculate Monthly sales', () => {
  test('Calculate Monthly sales', async () => {
    const col = await getProductsCol();
    const product = await col.findOne({
      // eanList: "3389119405058", //sales
      sdmn: 'idealo.de',
      asin: 'B001EBWLME',
    });
    //0773602470358 hauptkategorie in categoryTree
    if (product) {
      const monthlySales = calculateMonthlySales(
        product.categories!,
        product.salesRanks!,
        product.categoryTree!
      );
      console.log('monthlySales:', monthlySales);
    }
  });
});
