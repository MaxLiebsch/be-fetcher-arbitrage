import { describe, expect, test, beforeAll } from "@jest/globals";
//@ts-ignore
import testParameters from "./utils/testParamter.js";
import { extractProducts, extractProductsFromSecondPage, countProductPages,findMainCategories, findPaginationAndNextPage, findSubCategories, mimicTest, myAfterAll, myBeforeAll, productPageCount, extractProductsFromSecondPageQueueless, extractProductInfos } from "./utils/commonTests.js";

const shopDomain = "fressnapf.de";

describe(shopDomain.charAt(0).toUpperCase() + shopDomain.slice(1), () => {


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
  }, 1000000);

  test('Extract product Infos', async () => {
    const addProductInfo = async ({
      productInfo,
      url,
    }: {
      productInfo: any[] | null;
      url: string;
    }) => {
      if (productInfo) {
        const infoMap = new Map();
    productInfo.forEach((info) => infoMap.set(info.key, info.value));
        console.log('productInfo:', productInfo);
        const ean = infoMap.get('ean');
        const price = infoMap.get('price');
        const image = infoMap.get('image');
        const name = infoMap.get('name');
        expect(ean).toBe(testParameters[shopDomain].ean);
        expect(price).toBeDefined();
        expect(image).toBeDefined();
        expect(name).toBeDefined();
      
      } else {
        expect(1).toBe(2);
      }
    };
    await extractProductInfos(addProductInfo);
  }, 60000);


  test("Find Pagination and generate page 2 link", async () => {
    await findPaginationAndNextPage();
  }, 1000000);

  test("Extract Products from Product page", async () => {
    await extractProducts();
  }, 1000000);

  test(`Extract min. ${testParameters[shopDomain].productsPerPageAfterLoadMore} products from product page with load more button`, async () => {
    await extractProductsFromSecondPageQueueless(4);
  }, 1000000); 

  afterAll(async () => {
   await myAfterAll();
  });
});
