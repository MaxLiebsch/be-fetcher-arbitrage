import { describe, expect, test, beforeAll } from '@jest/globals';
import {
  mimicTest,
  myBeforeAll,
  querySellerInfos,
} from '../utils/commonTests.js';
import {
  AddProductInfo,
  DbProductRecord,
  generateMinimalUpdate,
  generateUpdate,
  NotFoundCause,
} from '@dipmaxtech/clr-pkg';
import { findProduct } from '../../../src/db/util/crudProducts.js';

const shopDomain = 'sellercentral.amazon.de';

describe(shopDomain.charAt(0).toUpperCase() + shopDomain.slice(1), () => {
  beforeAll(async () => {
    await myBeforeAll(shopDomain);
  }, 1000000);

  test('Mimic for block detection is working', async () => {
    await mimicTest();
  }, 1000000);

  // test('Extract product Infos', async () => {
  //   const product = await findProduct({ asin: 'B0DC6CXSWB' });
  //   if (!product) {
  //     throw new Error('Product not found');
  //   }

  //   const onNotFound = async (
  //     cause: NotFoundCause,
  //     prodinfo: AddProductInfo[]
  //   ) => {
  //     console.log('prodinfo:', prodinfo);
  //     console.log('cause:', cause);
  //   };
  //   const addProductInfo = async ({
  //     productInfo,
  //     url,
  //   }: {
  //     productInfo: any[] | null;
  //     url: string;
  //   }) => {
  //     console.log('productInfo:', productInfo);
  //     if (productInfo) {
  //       try {
  //         const update = generateUpdate(
  //           productInfo,
  //           product as unknown as DbProductRecord
  //         );
  //         console.log(update);
  //       } catch (error) {
  //         console.log('error:', error);
  //         console.log('error in generateUpdate');
  //       }
  //     } else {
  //       throw new Error('No product info found');
  //     }
  //   };

  //   const result = await querySellerInfos(
  //     addProductInfo,
  //     onNotFound,
  //     product as unknown as DbProductRecord,
  //     { lookupRetryLimit: 2, retries: 2 }
  //   );
  //   console.log('result:', result);
  // }, 200000);

  // test('Missing Sr', async () => {
  //   const product = await findProduct({ asin: 'B0DJTC5PGG' });
  //   if (!product) {
  //     throw new Error('Product not found');
  //   }

  //   const onNotFound = async (
  //     cause: NotFoundCause,
  //     prodinfo: AddProductInfo[]
  //   ) => {
  //     console.log('prodinfo:', prodinfo);
  //     console.log('cause:', cause);
  //   };
  //   const addProductInfo = async ({
  //     productInfo,
  //     url,
  //   }: {
  //     productInfo: any[] | null;
  //     url: string;
  //   }) => {
  //     console.log('productInfo:', productInfo);
  //     if (productInfo) {
  //       try {
  //         const update = generateUpdate(
  //           productInfo,
  //           product as unknown as DbProductRecord
  //         );
  //         console.log(update);
  //       } catch (error) {
  //         console.log('error:', error);
  //         console.log('error in generateUpdate');
  //       }
  //     } else {
  //       throw new Error('No product info found');
  //     }
  //   };

  //   const result = await querySellerInfos(
  //     addProductInfo,
  //     onNotFound,
  //     product as unknown as DbProductRecord,
  //     { lookupRetryLimit: 2, retries: 2 }
  //   );
  //   console.log('result:', result);
  // }, 200000);

  test('Not found', async () => {
    const product = await findProduct({ eanList: '0753759296650' });
    if (!product) {
      throw new Error('Product not found');
    }

    const onNotFound = async (
      cause: NotFoundCause,
      prodinfo: AddProductInfo[]
    ) => {
      console.log('prodinfo:', prodinfo);
      console.log('cause:', cause);
    };
    const addProductInfo = async ({
      productInfo,
      cause,
      url,
    }: {
      productInfo: any[] | null;
      cause: any;
      url: string;
    }) => {
      console.log('productInfo:', productInfo);
      if (productInfo) {
        try {
          if (cause === 'completeInfo') {
            const { update } = generateUpdate(
              productInfo,
              product as unknown as DbProductRecord
            );
            console.log(update);
          }
          if (cause === 'incompleteInfo' || cause === 'missingSellerRank') {
            let { update } = generateMinimalUpdate(productInfo, product);
            console.log('update:', update);
          }
        } catch (error) {
          console.log('error:', error);
          console.log('error in generateUpdate');
        }
      } else {
        throw new Error('No product info found');
      }
    };

    const result = await querySellerInfos(
      addProductInfo,
      onNotFound,
      product as unknown as DbProductRecord,
      { lookupRetryLimit: 2, retries: 2 }
    );
    console.log('result:', result);
  }, 200000);

  // afterAll(async () => {
  //   await myAfterAll();
  // });
});
