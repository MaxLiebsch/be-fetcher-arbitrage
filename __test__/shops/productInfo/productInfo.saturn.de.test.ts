import { describe, expect, test, beforeAll } from "@jest/globals";
//@ts-ignore
import testParameters from "../utils/testParamter.js";
import {
  extractProductInfos,
  mimicTest,
  myAfterAll,
  myBeforeAll,
} from "../utils/commonTests.js";

const shopDomain = "saturn.de";

describe(shopDomain.charAt(0).toUpperCase() + shopDomain.slice(1), () => {
  beforeAll(async () => {
    await myBeforeAll(shopDomain, false, '123.0.6312.105');
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
        const ean = productInfo.find((info) => info.key === "ean");
        const sku = productInfo.find((info) => info.key === "sku");
        const image = productInfo.find((info) => info.key === "image");
        
        expect(ean.value).toBe("8710103800576");
        expect(sku.value).toBe("107462622");
        expect(image?.value).toBeDefined();
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
