import { describe, expect, test, beforeAll } from "@jest/globals";
//@ts-ignore
import { getShops } from "../../src/services/db/util/shops.js";
import {
  checkForBlockingSignals,
  crawlProducts,
  getCategories,
  getPage,
  getPageNumberFromPagination,
  getProductCount,
  paginationUrlBuilder,
} from "@dipmaxtech/clr-pkg";
import { ShopObject, mainBrowser } from "@dipmaxtech/clr-pkg";
//@ts-ignore
import { proxyAuth } from "../../src/constants.js";
//@ts-ignore
import testParameters from "./testParamter.js";
import { Page } from "puppeteer";
import { Browser } from "puppeteer";
import findPagination from "@dipmaxtech/clr-pkg/lib/util/crawl/findPagination.js";

const shopDomain = "cyberport.de";
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

describe("Cyberport.de", () => {
  let browser: Browser | null = null;
  let shops: { [key: string]: ShopObject } | null = null;
  let page: Page | null = null;
  let initialProductPageUrl = "";
  let nextPageUrl = "";
  const pageNo = 2;
  let productsPerPage = 0;

  beforeAll(async () => {
    productsPerPage = testParameters[shopDomain].productsPerPage;
    initialProductPageUrl = testParameters[shopDomain].initialProductPageUrl;
    nextPageUrl = testParameters[shopDomain].nextPageUrl;

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
    if (page && shops && shops[shopDomain]) {
      const blocked = await checkForBlockingSignals(
        page,
        true,
        shops[shopDomain].mimic,
        "test.de"
      );
      if(blocked) {
        expect(blocked).toBe(true);
      }else{
        expect(blocked).toBe(false);
      }
    }
  });

  test("Find mainCategories", async () => {
    if (page && shops && shops[shopDomain]) {
      await page.goto(shops[shopDomain].entryPoints[0].url);
      const categories = await getCategories(page, {
        // @ts-ignore
        queue: new MockQueue(),
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
      expect(categories !== undefined).toBe(true);
      if (categories)
        expect(categories.length).toBe(
          testParameters[shopDomain].mainCategoriesCount
        );
    }
  }, 1000000);

  test("Find subCategories", async () => {
    if (page && shops && shops[shopDomain]) {
      await page.goto(initialProductPageUrl);
      const categories = await getCategories(
        page,
        {
          // @ts-ignore
          queue: new MockQueue(),
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
        },
        true
      );
      expect(categories !== undefined).toBe(true);
      if (categories)
        expect(categories.length).toBe(
          testParameters[shopDomain].subCategoriesCount
        );
    }
  }, 1000000);

  test("Find product in category count", async () => {
    if (page && shops && shops[shopDomain]) {
      await page.goto(initialProductPageUrl);

      const count = await getProductCount(page, shops[shopDomain].productList);

      expect(count !== null).toBe(true);
      expect(count).toBeGreaterThan(0);
    }
  });

  test("Find Pagination and generate page 2 link", async () => {
    if (page && shops && shops[shopDomain]) {
      const { pagination, paginationEl } = await findPagination(
        page,
        shops[shopDomain].paginationEl
      );
      expect(pagination).toBe(true);

      let nextUrl = `${initialProductPageUrl}${paginationEl.nav}${pageNo}`;
      if (paginationEl?.paginationUrlSchema) {
        nextUrl = paginationUrlBuilder(
          initialProductPageUrl,
          shops[shopDomain].paginationEl,
          pageNo,
          undefined
        );
      }
      expect(nextUrl).toBe(nextPageUrl);
    }
  }, 1000000);

  test("Extract Products from Product page", async () => {
    const products: any[] = [];
    const addProductCb = async (product: any) => {
      console.log("product:", product);
      products.push(product);
    };
    if (page && shops && shops[shopDomain]) {
      await crawlProducts(page, shops[shopDomain], pageNo, addProductCb, {
        name: "",
        link: "",
      });
    }
    const properties = ["name", "price", "image", "link"];
    const testProducts = products.every((product) =>
      properties.every((prop) => product[prop] !== "")
    );
    expect(testProducts).toBe(true);
    expect(products.length).toBe(productsPerPage);
  }, 1000000);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });
});
