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
import {
  mimicTest,
  extractProducts,
  findMainCategories,
  findSubCategories,
  productPageCount,
  findPaginationAndNextPage,
} from "./commonTests";
import { Page } from "puppeteer";
import { Browser } from "puppeteer";
import { Versions } from "@dipmaxtech/clr-pkg/lib/util/versionProvider.js";

const shopDomain = "cyberport.de";

describe("Cyberport.de", () => {
  let browser: Browser | null = null;
  let shops: { [key: string]: ShopObject } | null = null;
  let page: Page | null = null;
  const pageNo = 2;

  beforeAll(async () => {
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
      process.env.BROWSER_VERSION as Versions
    );
    console.log('process.env.BROWSER_VERSION:', process.env.BROWSER_VERSION)
    shops = await getShops([{ d: shopDomain }]);
    if (browser && shops && shops[shopDomain]) {
      page = await getPage(
        browser,
        shops[shopDomain],
        5,
        shops[shopDomain].resourceTypes["crawl"],
        shops[shopDomain].exceptions,
        shops[shopDomain].rules
      );
      await page.goto(shops[shopDomain].entryPoints[0].url);
    }
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

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });
});
