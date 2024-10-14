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
import { getShop } from "../../src/db/util/shops.js";

const shopDomain = "euronics.de";

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
        expect(ean.value).toBe("0195949188695");
      } else {
        expect(1).toBe(2);
      }
    };
    const shop = await getShop(shopDomain);
    if (shop) {
      await newPage(undefined, shop.resourceTypes["product"]);
      await extractProductInfos(addProductInfo);
    } else {
      expect(1).toBe(2);
    }
  }, 60000);

  test("Extract Products from Product page", async () => {
    await newPage();
    await extractProducts();
  }, 1000000);

  test(`Extract min. ${testParameters[shopDomain].productsPerPageAfterLoadMore} products from product page with load more button`, async () => {
    await extractProductsFromSecondPageQueueless(5);
  }, 1000000);

  test("Extract Products from Sales page", async () => {
    const shop = await getShop(shopDomain);
    if (shop) {
      await extractProductsFromSecondPageQueueless(
        5,
        testParameters[shopDomain].salesUrl
      );
    } else {
      expect(1).toBe(2);
    }
  }, 1000000);

  afterAll(async () => {
    await myAfterAll();
  });
});
