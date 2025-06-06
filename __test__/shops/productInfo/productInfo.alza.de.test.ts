import { describe, expect, test, beforeAll } from "@jest/globals";
//@ts-ignore
import testParameters from "../utils/testParamter.js";
import {
  extractProductInfos,
  mimicTest,
  myAfterAll,
  myBeforeAll,
} from "../utils/commonTests.js";
import { safeParsePrice } from "@dipmaxtech/clr-pkg";

const shopDomain = "alza.de";

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
        const prc = productInfo.find((info) => info.key === "price").value
        const price = safeParsePrice(prc);
        console.log('price:', price)
        const ean = productInfo.find((info) => info.key === "ean");
        const sku = productInfo.find((info) => info.key === "sku");
        const mku = productInfo.find((info) => info.key === "mku");

        expect(ean.value).toBe("8006023255733");
        expect(sku.value).toBe("480807");
        expect(mku.value).toBe("MEGD031c");
      } else {
        expect(1).toBe(2);
      }
    };
    await extractProductInfos(addProductInfo);
  }, 60000);

  afterAll(async () => {
    await myAfterAll();
  });
});
