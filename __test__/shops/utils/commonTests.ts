import { expect } from "@jest/globals";
import {
  ShopObject,
  browseProductPagesQueue,
  browseProductpages,
  checkForBlockingSignals,
  crawlProducts,
  getCategories,
  getPage,
  getProductCount,
  mainBrowser,
  paginationUrlBuilder,
} from "@dipmaxtech/clr-pkg";
import { Page } from "puppeteer";
import { MockQueue } from "./MockQueue.js";
import { Browser } from "puppeteer";
//@ts-ignore
import testParameters from "./testParamter.js";
import findPagination from "@dipmaxtech/clr-pkg/lib/util/crawl/findPagination";
//@ts-ignore
import { getShops } from "../../../src/services/db/util/shops.js";
//@ts-ignore
import { proxyAuth } from "../../../src/constants.js";
import { Versions } from "@dipmaxtech/clr-pkg/lib/util/versionProvider";

let browser: Browser | null = null;
let shops: { [key: string]: ShopObject } | null = null;
let page: Page | null = null;
const pageNo = 2;
let shopDomain = "";

export const myBeforeAll = async (_shopDomain: string, gb: boolean = false) => {
  shopDomain = _shopDomain;
  const task: { [key: string]: any } = {
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
  };
  if (gb) {
    (task["proxyType"] = "gb"), (task["timezones"] = ["Europe/Berlin"]);
  }

  browser = await mainBrowser(
    //@ts-ignore
    task,
    proxyAuth,
    process.env.BROWSER_VERSION as Versions
  );

  shops = await getShops([{ d: shopDomain }]);
  if (browser && shops && shops[shopDomain]) {
    page = await getPage(
      browser,
      shops[shopDomain],
      5,
      shops[shopDomain].resourceTypes["crawl"],
      shops[shopDomain].exceptions,
      shops[shopDomain].rules,
      task.timezones
    );
    await page.goto(shops[shopDomain].entryPoints[0].url);
  }
};

export const mimicTest = async () => {
  if (page && shops && shops[shopDomain]) {
    const blocked = await checkForBlockingSignals(
      page,
      true,
      shops[shopDomain].mimic,
      "test.de"
    );

    expect(blocked).toBe(false);
  }
};
export const findMainCategories = async () => {
  if (page && shops && shops[shopDomain]) {
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
    if (categories) {
      console.log("categories:", categories.length);
      expect(categories.length).toBe(
        testParameters[shopDomain].mainCategoriesCount
      );
    }
  }
};
export const findSubCategories = async () => {
  if (page && shops && shops[shopDomain]) {
    await page.goto(testParameters[shopDomain].subCategoryUrl);
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
};
export const productPageCount = async () => {
  if (page && shops && shops[shopDomain]) {
    await page.goto(testParameters[shopDomain].initialProductPageUrl);

    const count = await getProductCount(page, shops[shopDomain].productList);

    expect(count !== null).toBe(true);
    expect(count).toBeGreaterThan(0);
  }
};
export const findPaginationAndNextPage = async () => {
  if (page && shops && shops[shopDomain]) {
    const initialProductPageUrl =
      testParameters[shopDomain].initialProductPageUrl;
    const nextPageUrl = testParameters[shopDomain].nextPageUrl;

    const { pagination, paginationEl } = await findPagination(
      page,
      shops[shopDomain].paginationEl
    );
    expect(pagination !== null).toBe(true);

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
};

export const extractProducts = async () => {
  const products: any[] = [];
  const addProductCb = async (product: any) => {
    products.push(product);
  };
  const productsPerPage = testParameters[shopDomain].productsPerPage;
  if (page && shops && shops[shopDomain]) {
    await crawlProducts(page, shops[shopDomain], addProductCb, {
      name: "",
      link: "",
    });
  }
  const properties = ["name", "price", "image", "link"];
  const missingProperties: { [key: string]: any } = {
    name: 0,
    price: 0,
    link: 0,
    image: 0,
  };
  const testProducts = products.every((product) =>
    properties.every((prop) => {
      if (product[prop] === "") missingProperties[prop]++;

      return product[prop] !== "";
    })
  );
  console.log("missingProperties:", missingProperties);

  expect(testProducts).toBe(true);
  expect(products.length).toBe(productsPerPage);
  if (products.length > 0)
    console.log(
      "Products cnt ",
      products.length,
      "Product: ",
      JSON.stringify(products[0], null, 2)
    );
};

export const extractProductsFromSecondPage = async () => {
  const initialProductPageUrl =
    testParameters[shopDomain].initialProductPageUrl;
  const productsPerPageAfterLoadMore =
    testParameters[shopDomain].productsPerPageAfterLoadMore;
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
};

export const extractProductsFromSecondPageQueueless = async () => {
  const initialProductPageUrl =
    testParameters[shopDomain].initialProductPageUrl;
  const productsPerPageAfterLoadMore =
    testParameters[shopDomain].productsPerPageAfterLoadMore;
  const products: any[] = [];
  const addProductCb = async (product: any) => {
    products.push(product);
  };
  if (page && shops && shops[shopDomain]) {
    await page.goto(initialProductPageUrl);
    const result = await browseProductpages(
      page,
      shops[shopDomain],
      addProductCb,
      {
        name: "",
        link: "",
      },
      {
        pages: 5,
        mainCategory: 0,
        subCategory: 0,
      }
    );
    if (result === "crawled") {
      expect(products.length).toBeGreaterThan(productsPerPageAfterLoadMore);
      if (products.length > 0) console.log(products[0]);
    }
  }
};

export const commonTests = async () => {
  await Promise.all([
    mimicTest(),
    findMainCategories(),
    findSubCategories(),
    productPageCount(),
    findPaginationAndNextPage(),
    extractProducts(),
  ]);
};

export const myAfterAll = async () => {
  if (browser) {
    await browser.close();
  }
};
