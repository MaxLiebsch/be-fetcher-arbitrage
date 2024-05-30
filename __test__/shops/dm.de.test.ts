import { describe, expect, test, beforeAll } from "@jest/globals";
//@ts-ignore
import { getShops } from "../../src/services/db/util/shops.js";
import {
  crawlProducts,
  getCategories,
  ShopObject,
  mainBrowser,
  getProductCount,
  paginationUrlBuilder,
  browseProductPagesQueue,
  getPage,
  checkForBlockingSignals,
} from "@dipmaxtech/clr-pkg";
//@ts-ignore
import { proxyAuth } from "../../src/constants.js";
//@ts-ignore
import testParameters from "./testParamter.js";
import { Page } from "puppeteer";
import { Browser } from "puppeteer";
import findPagination from "@dipmaxtech/clr-pkg/lib/util/crawl/findPagination.js";
import { extractProducts, findMainCategories, findPaginationAndNextPage, findSubCategories, mimicTest, productPageCount } from "./commonTests.js";

const shopDomain = "dm.de";

class MockQueue {
  queue: string[] = [];
  constructor() {}

  public addCategoryLink(link: string) {
    this.queue.push(link);
  }

  public doesCategoryLinkExist(link: string) {
    return false;
  }
}

describe(shopDomain.charAt(0).toUpperCase() + shopDomain.slice(1), () => {
  let browser: Browser | null = null;
  let shops: { [key: string]: ShopObject } | null = null;
  let page: Page | null = null;
  let initialProductPageUrl = "";
  let nextPageUrl = "";
  const pageNo = 2;
  let productsPerPage = 0;
  let productsPerPageAfterLoadMore = 0;

  beforeAll(async () => {
    productsPerPage = testParameters[shopDomain].productsPerPage;
    initialProductPageUrl = testParameters[shopDomain].initialProductPageUrl;
    nextPageUrl = testParameters[shopDomain].nextPageUrl;
    productsPerPageAfterLoadMore =
      testParameters[shopDomain].productsPerPageAfterLoadMore;

    browser = await mainBrowser(
      {
        productLimit: 500,
        statistics: {
          estimatedProducts: 500,
          statusHeuristic: {
            "error-handled": 0,
            "not-found": 0,
            "page-completed": 0,
            "limit-reached": 0,
            total: 0,
          },
          retriesHeuristic: {
            "0": 0,
            "1-9": 0,
            "10-49": 0,
            "50-99": 0,
            "100-499": 0,
            "500+": 0,
          },
          resetedSession: 0,
          errorTypeCount: {},
          browserStarts: 0,
        },
      },
      proxyAuth,
      "124.0.6367.60"
    );
    shops = await getShops([{ d: shopDomain }]);
    if (browser && shops)
      page = await getPage(
        browser,
        shops[shopDomain],
        5,
        shops[shopDomain].resourceTypes["crawl"],
        shops[shopDomain].exceptions,
        shops[shopDomain].rules
      );
  }, 1000000);

  test("Mimic for block detection is working", async () => {
    await mimicTest(page, shops, shopDomain);
  }, 1000000);

  test("Find mainCategories", async () => {
    await findMainCategories(page, shops, shopDomain);
  }, 1000000);

  test("Find subCategories", async () => {
    await findSubCategories(page, shops, shopDomain);
  }, 1000000);

  test("Find product in category count", async () => {
    await productPageCount(page, shops, shopDomain);
  });

  test("Find Pagination and generate page 2 link", async () => {
    await findPaginationAndNextPage(
      page,
      shops,
      shopDomain,
      pageNo,
    );
  }, 1000000);

  test("Extract Products from Product page", async () => {
    await extractProducts(page, shops, shopDomain);
  }, 1000000);

  test(`Extract min. ${productsPerPageAfterLoadMore} products from product page with load more button`, async () => {
    const products: any[] = [];
    const addProductCb = async (product: any) => {
      products.push(product);
    };
    if (page && shops && shops[shopDomain]) {
      await page.goto(initialProductPageUrl);
      await browseProductPagesQueue(page, {
        // @ts-ignore
        queue: new MockQueue(),
        addProduct: addProductCb,
        pageInfo: {
          name: "",
          link: "",
        },
        limit: {
          pages: 5,
          mainCategory: 0,
          subCategory: 0,
        },
        categoriesHeuristic: {
          subCategories: {
            0: 0,
            "1-9": 0,
            "10-19": 0,
            "20-29": 0,
            "30-39": 0,
            "40-49": 0,
            "+50": 0,
          },
          mainCategories: 0,
        },
        productPageCountHeuristic: {
          0: 0,
          "1-9": 0,
          "10-49": 0,
          "+50": 0,
        },
        shop: shops[shopDomain],
      });
      expect(products.length).toBeGreaterThan(productsPerPageAfterLoadMore);
      if (products.length > 0) console.log(products[0]);
    }
  }, 1000000);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });
});
