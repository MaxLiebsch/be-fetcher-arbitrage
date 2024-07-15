import { describe, expect, test, beforeAll } from "@jest/globals";
//@ts-ignore
import testParameters from "../utils/testParamter.js";
import {
  extractProductInfos,
  mimicTest,
  myAfterAll,
  myBeforeAll,
  querySellerInfos,
} from "../utils/commonTests.js";
import {
  safeParsePrice,
  calculateAznArbitrage,
  getNumber,
  generateUpdate,
} from "@dipmaxtech/clr-pkg";

const shopDomain = "sellercentral.amazon.de";
//TODO: test notfound, multiple asins
//TODO : make sure mimic does not create fake block
describe(shopDomain.charAt(0).toUpperCase() + shopDomain.slice(1), () => {
  beforeAll(async () => {
    await myBeforeAll(shopDomain, false, '124.0.6367.207');
  }, 1000000);

  test("Mimic for block detection is working", async () => {
    await mimicTest();
  }, 1000000);

  test("Extract product Infos", async () => {
    const addProductInfo = async ({
      productInfo,
      url,
    }: {
      productInfo: any[] | null;
      url: string;
    }) => {
      if (productInfo) {
        const update = generateUpdate(productInfo, 6);
        console.log(update);
      }
    };
    await querySellerInfos(addProductInfo, "B015AFAVOO");
  }, 200000);


  // afterAll(async () => {
  //   await myAfterAll();
  // });
});
