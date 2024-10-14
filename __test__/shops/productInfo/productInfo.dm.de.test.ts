import { describe, expect, test, beforeAll } from "@jest/globals";
import {
  extractProductInfos,
  mimicTest,
  myBeforeAll,
} from "../utils/commonTests.js";

const shopDomain = "dm.de";

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
        const image = productInfo.find((info) => info.key === "image");
        expect(ean.value).toBe("4262402599902");
        expect(image.value).toBeDefined();
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
