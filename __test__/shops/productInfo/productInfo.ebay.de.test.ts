import { describe, expect, test, beforeAll } from "@jest/globals";
import {
  extractProductInfos,
  mimicTest,
  myAfterAll,
  myBeforeAll,
} from "../utils/commonTests.js";
import { safeParsePrice } from "@dipmaxtech/clr-pkg";
import { LISTING_EXPIRED_STRINGS } from "../../../src/util/scrapeEbyListingsHelper.js";

const shopDomain = "ebay.de";

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
        const instock = map.get("instock");
        if (
          instock &&
          LISTING_EXPIRED_STRINGS.some((str) =>
            instock.toLowerCase().includes(str.toLowerCase())
          )
        ) {
          console.log("expired:", true);
        } else {
          if (map.get("e_prc")) {
            console.log("e_prc", safeParsePrice(map.get("e_prc")));
          }
        }
        // expect(map.get("ean")).toBe("0195949048258");
        // expect(map.get("price")).toBe("EUR1.249,00");
        // expect(map.get("categories")?.length).toBe(4);
        // const rawSellPrice = map.get("price");
        // const buyPrice = 3;
        // const sellPrice = safeParsePrice(rawSellPrice);
        // const parsedCategories = parseEbyCategories(map.get("categories"));
        // let mappedCategory = findMappedCategory(parsedCategories);
        // if (mappedCategory) {
        //   let ebyArbitrage = calculateEbyArbitrage(
        //     mappedCategory,
        //     sellPrice,
        //     buyPrice
        //   );
        //   console.log("ebyArbitrage:", ebyArbitrage);
        // }
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
