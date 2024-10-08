import { describe, expect, test, beforeAll } from "@jest/globals";
import {
  extractProductInfos,
  mimicTest,
  myBeforeAll,
} from "../utils/commonTests.js";

const shopDomain = "proshop.de";

describe(shopDomain.charAt(0).toUpperCase() + shopDomain.slice(1), () => {
  beforeAll(async () => {
    await myBeforeAll(shopDomain, "de", "129.0.6668.89");
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
        console.log("productInfo:", productInfo);
        const ean = productInfo.find((info) => info.key === "ean");
        expect(ean.value).toBe("4250569400872");
      } else {
        expect(1).toBe(2);
      }
    };
    await extractProductInfos(addProductInfo);
  }, 60000);

  // afterAll(async () => {
  //   await myAfterAll();
  // });
});
