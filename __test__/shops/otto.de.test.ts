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


const match = module.filename.match(/shops\\(.*?\.\w+)/);
let shopDomain: string | null = null;
if (match && match[1]) {
  shopDomain = match[1];
} else {
  console.log("No match found");
}

if (!shopDomain) throw new Error("Shop domain not found in file path");

describe(shopDomain.charAt(0).toUpperCase() + shopDomain.slice(1), () => {
  beforeAll(async () => {
    await myBeforeAll(shopDomain);
  }, 1000000);

  test("Mimic for block detection is working", async () => {
    await mimicTest();
  }, 1000000);

  // test("Find mainCategories", async () => {
  //   const result = await findMainCategories();
  //   console.log("result:", result);
  //   if (result === undefined) {
  //     expect(1).toBe(2);
  //   }
  // }, 1000000);
  // test("Find subCategories", async () => {
  //   const result = await findSubCategories();
  //   console.log("sub categories", result);
  //   if (result === undefined) {
  //     expect(1).toBe(2);
  //   }
  // }, 1000000);

  // test("Find product in category count", async () => {
  //   await productPageCount();
  // }, 1000000);

  // test("Find Pagination and generate page 2 link", async () => {
  //   await findPaginationAndNextPage();
  // }, 1000000);

  // test("Extract product Infos", async () => {
  //   const addProductInfo = async ({
  //     productInfo,
  //     url,
  //   }: {
  //     productInfo: any[] | null;
  //     url: string;
  //   }) => {
  //     if (productInfo) {
  //       console.log("productInfo:", productInfo);
  //       const ean = productInfo.find((info) => info.key === "ean");
  //       expect(ean.value).toBe(testParameters[shopDomain].ean);
  //     } else {
  //       expect(1).toBe(2);
  //     }
  //   };
  //   await extractProductInfos(addProductInfo);
  // }, 60000);

  // test("Extract Products from Product page", async () => {
  //   await newPage();
  //   await extractProducts(testParameters[shopDomain].initialProductPageUrl);
  // }, 1000000);

  test(`Extract min. ${testParameters[shopDomain].productsPerPageAfterLoadMore} products from product page with load more button`, async () => {
    await extractProductsFromSecondPageQueueless(4);
  }, 1000000);

  // afterAll(async () => {
  //   await myAfterAll();
  // });
});
