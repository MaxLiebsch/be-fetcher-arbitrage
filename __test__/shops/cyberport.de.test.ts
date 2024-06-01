import { describe, test, beforeAll } from "@jest/globals";
//@ts-ignore
import {
  mimicTest,
  extractProducts,
  findMainCategories,
  findSubCategories,
  productPageCount,
  findPaginationAndNextPage,
  myBeforeAll,
  myAfterAll,
} from "./utils/commonTests";

const shopDomain = "cyberport.de";

describe("Cyberport.de", () => {

  beforeAll(async () => {
    await myBeforeAll(shopDomain);
  }, 1000000);

  test("Mimic for block detection is working", async () => {
    await mimicTest();
  }, 1000000);

  test("Find mainCategories", async () => {
    await findMainCategories();
  }, 1000000);

  test("Find subCategories", async () => {
    await findSubCategories();
  }, 1000000);

  test("Find product in category count", async () => {
    await productPageCount();
  });

  test("Find Pagination and generate page 2 link", async () => {
    await findPaginationAndNextPage();
  }, 1000000);

  test("Extract Products from Product page", async () => {
    await extractProducts();
  }, 1000000);

  afterAll(async () => {
    await myAfterAll()
  });
});
