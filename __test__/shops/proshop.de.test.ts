import { describe, test, beforeAll } from "@jest/globals";
import testParameters from "./utils/testParamter.js";
import {
  extractProducts,
  extractProductsFromSecondPageQueueless,
  findMainCategories,
  findPaginationAndNextPage,
  findSubCategories,
  mimicTest,
  myAfterAll,
  myBeforeAll,
  productPageCount,
} from "./utils/commonTests.js";

const shopDomain = "proshop.de";

describe(shopDomain.charAt(0).toUpperCase() + shopDomain.slice(1), () => {
  beforeAll(async () => {
    await myBeforeAll(shopDomain);
  }, 1000000);

  test("Mimic for block detection is working", async () => {
    await mimicTest();
  }, 1000000);

  test("Find mainCategories", async () => {
    const result = await findMainCategories();
    console.log("result:", result);
  }, 1000000);

  test("Find subCategories", async () => {
    await findSubCategories();
  }, 1000000);

  test("Find product in category count", async () => {
    await productPageCount();
  }, 1000000);

  test("Find Pagination and generate page 2 link", async () => {
    await findPaginationAndNextPage();
  }, 1000000);

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
