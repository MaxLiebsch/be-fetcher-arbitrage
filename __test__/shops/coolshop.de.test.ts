import { describe, test, beforeAll } from "@jest/globals";
import testParameters from "./utils/testParamter.js";
import {
  extractProductInfos,
  extractProducts,
  extractProductsFromSecondPageQueueless,
  findMainCategories,
  findPaginationAndNextPage,
  findSubCategories,
  mimicTest,
  myAfterAll,
  myBeforeAll,
  newPage,
  productPageCount,
} from "./utils/commonTests.js";

const shopDomain = "coolshop.de";

describe(shopDomain.charAt(0).toUpperCase() + shopDomain.slice(1), () => {
  beforeAll(async () => {
    await myBeforeAll(shopDomain);
  }, 1000000);

  test("Mimic for block detection is working", async () => {
    await mimicTest();
  }, 1000000);

  test("Find subCategories", async () => {
    const result = await findSubCategories();
    console.log("sub categories", result);
  }, 1000000);

  test("Find product in category count", async () => {
    await productPageCount();
  }, 1000000);

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
        expect(ean.value).toBe("5030945125372");
      } else {
        expect(1).toBe(2);
      }
    };
    await extractProductInfos(addProductInfo);
  }, 60000);

  test("Extract Products from Product page", async () => {
    await newPage();
    await extractProducts();
  }, 1000000);

  test(`Extract min. ${testParameters[shopDomain].productsPerPageAfterLoadMore} products from product page with load more button`, async () => {
    await extractProductsFromSecondPageQueueless(10);
  }, 1000000);

  afterAll(async () => {
    await myAfterAll();
  });
});
