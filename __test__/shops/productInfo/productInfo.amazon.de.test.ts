import { describe, expect, test, beforeAll } from "@jest/globals";
import {
  extractProductInfos,
  mimicTest,
  myAfterAll,
  myBeforeAll,
} from "../utils/commonTests.js";


const shopDomain = "amazon.de";

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
        console.log("productInfo:", productInfo);
        const map = new Map(productInfo.map((x) => [x.key, x.value]));
        // expect(map.get("ean")).toBe("0195949048258");
        // expect(map.get("price")).toBe("EUR1.249,00");
        // expect(map.get("categories")?.length).toBe(4);

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
