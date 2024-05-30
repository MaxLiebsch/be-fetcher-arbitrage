import { expect } from "@jest/globals";
import {
  ShopObject,
  checkForBlockingSignals,
  crawlProducts,
  getCategories,
  getPage,
  getPageNumberFromPagination,
  getProductCount,
  paginationUrlBuilder,
} from "@dipmaxtech/clr-pkg";
import { Page } from "puppeteer";
import { Shops } from "./types";
import { MockQueue } from "./MockQueue";
//@ts-ignore
import testParameters from "./testParamter.js";
import findPagination from "@dipmaxtech/clr-pkg/lib/util/crawl/findPagination";

export const mimicTest = async (
  page: Page | null,
  shops: Shops | null,
  shopDomain: string
) => {
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
export const findMainCategories = async (
  page: Page | null,
  shops: Shops | null,
  shopDomain: string
) => {
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
    if (categories)
      expect(categories.length).toBe(
        testParameters[shopDomain].mainCategoriesCount
      );
  }
};
export const findSubCategories = async (
  page: Page | null,
  shops: Shops | null,
  shopDomain: string
) => {
  if (page && shops && shops[shopDomain]) {
    await page.goto(testParameters[shopDomain].initialProductPageUrl);
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
export const productPageCount = async (
  page: Page | null,
  shops: Shops | null,
  shopDomain: string
) => {
  if (page && shops && shops[shopDomain]) {
    await page.goto(testParameters[shopDomain].initialProductPageUrl);

    const count = await getProductCount(page, shops[shopDomain].productList);

    expect(count !== null).toBe(true);
    expect(count).toBeGreaterThan(0);
  }
};
export const findPaginationAndNextPage = async (
  page: Page | null,
  shops: Shops | null,
  shopDomain: string,
  pageNo: number
) => {
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

export const extractProducts = async (
  page: Page | null,
  shops: Shops | null,
  shopDomain: string
) => {
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
  const testProducts = products.every((product) =>
    properties.every((prop) => product[prop] !== "")
  );
  expect(testProducts).toBe(true);
  expect(products.length).toBe(productsPerPage);
  if (products.length > 0)
    console.log("Product: ", JSON.stringify(products[0], null, 2));
};

export const commonTests = async (
  page: Page | null,
  shops: Shops | null,
  shopDomain: string,
  pageNo: number
) => {
  await Promise.all([
    mimicTest(page, shops, shopDomain),
    findMainCategories(page, shops, shopDomain),
    findSubCategories(page, shops, shopDomain),
    productPageCount(page, shops, shopDomain),
    findPaginationAndNextPage(page, shops, shopDomain, pageNo),
    extractProducts(page, shops, shopDomain),
  ])
};
