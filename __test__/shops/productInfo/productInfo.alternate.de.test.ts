import { describe, expect, test, beforeAll } from "@jest/globals";
//@ts-ignore
import testParameters from "../utils/testParamter.js";
import {
  extractProductInfos,
  mimicTest,
  myAfterAll,
  myBeforeAll,
} from "../utils/commonTests.js";

const shopDomain = "alternate.de";

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
        console.log('productInfo:', productInfo)
        const ean = productInfo.find((info) => info.key === "ean");
        const sku = productInfo.find((info) => info.key === "sku");
        expect(ean.value).toBe("0810084692745");
        expect(sku.value).toBe(100047357);
      } else {
        expect(1).toBe(2);
      }
    };
    await extractProductInfos(addProductInfo);
  },60000);

  afterAll(async () => {
    await myAfterAll();
  });
});
