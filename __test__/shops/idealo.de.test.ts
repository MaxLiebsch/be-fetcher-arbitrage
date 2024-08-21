import { describe, expect, test, beforeAll } from "@jest/globals";
//@ts-ignore
import testParameters from "./utils/testParamter.js";
import {
  extractProducts,
  extractProductsFromSecondPage,
  extractProductsFromSecondPageQueueless,
  findPaginationAndNextPage,
  findSubCategories,
  extractProductInfos,
  mimicTest,
  myAfterAll,
  myBeforeAll,
  productPageCount,
} from "./utils/commonTests.js";
import { add } from "date-fns";

const shopDomain = "idealo.de";

describe(shopDomain.charAt(0).toUpperCase() + shopDomain.slice(1), () => {
  beforeAll(async () => {
    await myBeforeAll(shopDomain, false, '127.0.6533.119');
  }, 1000000);

  test("Mimic for block detection is working", async () => {
    await mimicTest();
  }, 1000000);

  test("Find mainCategories - added manually", async () => {
    expect(true).toBe(true);
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

  test("Extract Products from Product page", async () => {
    await extractProducts();
  }, 1000000);

  test(`Extract min. ${testParameters[shopDomain].productsPerPageAfterLoadMore} products from product page with load more button`, async () => {
    await extractProductsFromSecondPageQueueless();
  }, 1000000);

  test("Extract product Infos", async () => {
    const addProductInfo = async ({
      productInfo,
      url,
    }: {
      productInfo: any[] | null;
      url: string;
    }) => {
      console.log("productInfo:", productInfo);
    };
    await extractProductInfos(addProductInfo);
  });

  afterAll(async () => {
    await myAfterAll();
  });
});
