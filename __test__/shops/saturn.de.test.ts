import { describe, expect, test, beforeAll } from "@jest/globals";
//@ts-ignore
import testParameters from "./utils/testParamter.js";
import {
  extractProductInfos,
  extractProducts,
  extractProductsFromSecondPage,
  extractProductsFromSecondPageQueueless,
  findPaginationAndNextPage,
  findSubCategories,
  mimicTest,
  myAfterAll,
  myBeforeAll,
  productPageCount,
} from "./utils/commonTests.js";

const match = module.filename.match(/shops\\(.*?\.\w+)/);
let shopDomain: string | null = null;
if (match && match[1]) {
    shopDomain = match[1];
} else {
    console.log("No match found");
}

if(!shopDomain) throw new Error("Shop domain not found in file path");

describe(shopDomain.charAt(0).toUpperCase() + shopDomain.slice(1), () => {
  beforeAll(async () => {
    await myBeforeAll(shopDomain);
  }, 1000000);

  test("Mimic for block detection is working", async () => {
    await mimicTest();
  }, 1000000);

  test("Find subCategories", async () => {
    await findSubCategories();
  }, 1000000);

  test("Find product in category count", async () => {
    await productPageCount();
  },1000000);

  test("Find Pagination and generate page 2 link", async () => {
    await findPaginationAndNextPage();
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
        expect(ean.value).toBe(testParameters[shopDomain].ean);
      } else {
        expect(1).toBe(2);
      }
    };
    await extractProductInfos(addProductInfo);
  }, 60000);

  test("Extract Products from Product page", async () => {
    await extractProducts();
  }, 1000000);

  test(`Extract min. ${testParameters[shopDomain].productsPerPageAfterLoadMore} products from product page with load more button`, async () => {
    await extractProductsFromSecondPageQueueless();
  }, 1000000);

  afterAll(async () => {
    await myAfterAll();
  });
});
