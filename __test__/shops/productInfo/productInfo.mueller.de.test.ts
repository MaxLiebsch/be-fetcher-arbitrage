import { describe, expect, test, beforeAll } from "@jest/globals";
//@ts-ignore
import testParameters from "../utils/testParamter.js";
import {
  extractProductInfos,
  mimicTest,
  myAfterAll,
  myBeforeAll,
} from "../utils/commonTests.js";

const shopDomain = "mueller.de";

describe(shopDomain.charAt(0).toUpperCase() + shopDomain.slice(1), () => {
  beforeAll(async () => {
    await myBeforeAll(shopDomain);
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
        const image = productInfo.find((info) => info.key === "image");
        
        expect(ean.value).toBe("2200291947598");
        expect(image?.value).toBeDefined();
        expect(sku.value).toBe("IPN2919475");
      } else {
        expect(1).toBe(2);
      }
    };
    await extractProductInfos(addProductInfo);
  },60000);

  // afterAll(async () => {
  //   await myAfterAll();
  // });
});
