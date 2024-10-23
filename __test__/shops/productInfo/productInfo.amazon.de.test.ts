import { describe, expect, test, beforeAll } from '@jest/globals';
import {
  extractProductInfos,
  mimicTest,
  myAfterAll,
  myBeforeAll,
} from '../utils/commonTests.js';
import { extractSellerRank, safeParsePrice } from '@dipmaxtech/clr-pkg';

const shopDomain = 'amazon.de';

describe(shopDomain.charAt(0).toUpperCase() + shopDomain.slice(1), () => {
  beforeAll(async () => {
    await myBeforeAll(shopDomain);
  }, 1000000);

  test('Mimic for block detection is working', async () => {
    await mimicTest();
  }, 1000000);

  test('Extract product Infos', async () => {
    const addProductInfo = async ({
      productInfo,
      url,
    }: {
      productInfo: any[] | null;
      url: string;
    }) => {
      if (productInfo) {
        const update = {};
        console.log('productInfo:', productInfo);
        const map = new Map(productInfo.map((x) => [x.key, x.value]));

        const bsr = map.get('bsr');
        if (bsr) {
          console.log('bsr:', extractSellerRank(bsr, update));
        }

        const a_rating = map.get('a_rating');

        if (a_rating) {
          update['a_rating'] = safeParsePrice(a_rating);
        }

        const a_reviewcnt = map.get('a_reviewcnt');

        if (a_reviewcnt) {
          update['a_reviewcnt'] = safeParsePrice(a_reviewcnt);
        }
        console.log(update);
        // expect(map.get("ean")).toBe("0195949048258");
        // expect(map.get("price")).toBe("EUR1.249,00");
        // expect(map.get("categories")?.length).toBe(4);
      } else {
        expect(1).toBe(2);
      }
    };
    await extractProductInfos(
      addProductInfo,
      'https://www.amazon.de/dp/product/B00ZETXNAQ?language=de_DE',
    );
  }, 60000);

  // afterAll(async () => {
  //   await myAfterAll();
  // });
});
