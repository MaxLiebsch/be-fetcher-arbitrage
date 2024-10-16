import { expect } from "@jest/globals";
import {
  CHROME_VERSIONS,
  ProxyType,
  ResourceTypes,
  Shop,
  browseProductPagesQueue,
  browseProductpages,
  checkForBlockingSignals,
  crawlProducts,
  getCategories,
  getPage,
  getPageNumberFromPagination,
  getProductCount,
  initFingerPrintForHost,
  lookupProductQueue,
  mainBrowser,
  notifyProxyChange,
  paginationUrlSchemaBuilder,
  queryEansOnEbyQueue,
  queryProductPageQueue,
  querySellerInfosQueue,
  queryURLBuilder,
  registerRequest,
  uuid,
} from "@dipmaxtech/clr-pkg";
import { Page } from "puppeteer";
import { MockQueue } from "./MockQueue.js";
import { Browser } from "puppeteer";
import testParameters from "./testParamter.js";
import findPagination from "@dipmaxtech/clr-pkg/lib/util/crawl/findPagination";
import { getShops, updateShops } from "../../../src/db/util/shops.js";
import { proxyAuth } from "../../../src/constants.js";
import { shops } from "../../../src/shops.js";

let browser: Browser | null = null;
let page: Page | null = null;
const pageNo = 2;
let shopDomain = "";

export const visitPage = async (page: Page, url: string, shop: Shop) => {
  const requestId = uuid();
  const { proxyType, allowedHosts, waitUntil } = shop;
  const originalGoto = page.goto;
  page.goto = async function (url, options) {
    if (proxyType && proxyType !== "mix") {
      await notifyProxyChange(
        proxyType,
        url,
        requestId,
        Date.now(),
        allowedHosts
      );
    } else {
      await registerRequest(url, requestId, allowedHosts || [], Date.now());
    }
    return originalGoto.apply(this, [url, options]);
  };

  return page.goto(url, {
    waitUntil: waitUntil ? waitUntil.entryPoint : "networkidle2",
    timeout: 60000,
  });
};

export const createPage = async (browser: Browser, shop: Shop) => {
  const { proxyType, resourceTypes } = shop;
  const disAllowedResourceTypes = resourceTypes["crawl"];

  initFingerPrintForHost(`www.${shop.d}`, true, proxyType);

  const pageAndFingerprint = await getPage({
    browser,
    host: `www.${shopDomain}`,
    shop: shop,
    requestCount: Math.floor(Math.random() * 1000) * 11,
    disAllowedResourceTypes: disAllowedResourceTypes
      ? disAllowedResourceTypes
      : shop.resourceTypes["crawl"],
    exceptions: shop.exceptions,
    rules: shop.rules,
    proxyType,
  });
  return pageAndFingerprint.page;
};

export const newPage = async (
  url?: string,
  disAllowedResourceTypes?: ResourceTypes[]
) => {
  if (!browser) return;
  if (!shops || !shops[shopDomain]) return;
  const shop = shops[shopDomain];
  if (!shop) return;
  initFingerPrintForHost(`www.${shopDomain}`, true, shop.proxyType);

  const pageAndFingerprint = await getPage({
    browser,
    host: `www.${shopDomain}`,
    shop: shop,
    requestCount: Math.floor(Math.random() * 1000) * 11,
    disAllowedResourceTypes: disAllowedResourceTypes
      ? disAllowedResourceTypes
      : shop.resourceTypes["crawl"],
    exceptions: shop.exceptions,
    rules: shop.rules,
    proxyType: shop.proxyType,
  });
  page = pageAndFingerprint.page;

  if (page && url)
    await page.goto(url, {
      timeout: 120000,
    });

  return pageAndFingerprint;
};

export const myBeforeAll = async (_shopDomain: string) => {
  shopDomain = _shopDomain;

  browser = await mainBrowser(proxyAuth, CHROME_VERSIONS[0]);
  await updateShops(shops);
  const shop = shops[shopDomain];
  if (!shop) return;

  const { proxyType } = shop;
  if (browser && shop) {
    if (proxyType) {
      await notifyProxyChange(
        proxyType,
        shop.entryPoints[0].url,
        uuid(),
        Date.now(),
        shop.allowedHosts || []
      );
    } else {
      await registerRequest(
        shop.entryPoints[0].url,
        uuid(),
        shop.allowedHosts || [],
        Date.now()
      );
    }
    const pageAndFingerprint = await newPage(shop.entryPoints[0].url);
    if (pageAndFingerprint) console.log(pageAndFingerprint.fingerprint);
  }
};

export const mimicTest = async () => {
  if (page && shops[shopDomain]) {
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
  if (page && shops[shopDomain]) {
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
      expect(categories.length).toBe(
        testParameters[shopDomain].mainCategoriesCount
      );
      return categories;
    } else {
      expect(1).toBe(2);
    }
  }
};
export const findSubCategories = async () => {
  if (page  && shops[shopDomain]) {
    try {
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
      if (categories) {
        expect(categories.length).toBe(
          testParameters[shopDomain].subCategoriesCount
        );
        return categories;
      } else {
        expect(1).toBe(2);
      }
    } catch (error) {
      console.log("Error in findSubCategories", error);
      expect(1).toBe(2);
    }
  }
};
export const productPageCount = async (url = "") => {
  if (page  && shops[shopDomain]) {
    await page.goto(
      url ? url : testParameters[shopDomain].initialProductPageUrl
    );

    const count = await getProductCount(page, shops[shopDomain].productList);

    expect(count !== null).toBe(true);
    expect(count).toBeGreaterThan(0);
  }
};

export const countProductPages = async () => {
  if (page  && shops[shopDomain]) {
    await page.goto(testParameters[shopDomain].countProductPageUrl);

    const count = await getProductCount(page, shops[shopDomain].productList);

    const pageNumberCount = await getPageNumberFromPagination(
      page,
      shops[shopDomain],
      shops[shopDomain].paginationEl[0],
      count || 0
    );
    expect(pageNumberCount).toBeGreaterThan(testParameters[shopDomain].pages);
  }
};
export const findPaginationAndNextPage = async () => {
  if (page && shops[shopDomain]) {
    const initialProductPageUrl =
      testParameters[shopDomain].initialProductPageUrl;
    const nextPageUrl = testParameters[shopDomain].nextPageUrl;
    await page?.goto(initialProductPageUrl);

    const { pagination, paginationEl } = await findPagination(
      page,
      shops[shopDomain].paginationEl
    );
    expect(pagination !== null).toBe(true);

    let nextUrl = `${initialProductPageUrl}${paginationEl.nav}${pageNo}`;
    if (paginationEl?.paginationUrlSchema) {
      nextUrl = await paginationUrlSchemaBuilder(
        initialProductPageUrl,
        shops[shopDomain].paginationEl,
        pageNo,
        undefined
      );
    }
    expect(nextUrl).toBe(nextPageUrl);
  }
};

export const extractProducts = async (url?: string) => {
  const products: any[] = [];
  const _shopParameters = testParameters[shopDomain];
  const shop = shops ? shops[shopDomain] : null;
  if (!shop) return;

  const addProductCb = async (product: any) => {
    products.push(product);
  };
  const productsPerPage = _shopParameters.productsPerPage;
  const productsPageUrl = _shopParameters.countProductPageUrl;
  await page?.goto(url || productsPageUrl);
  if (page) {
    await crawlProducts(
      page,
      shop,
      addProductCb,
      {
        name: "",
        link: "",
      },
      2
    );
  }
  const properties = ["name", "price", "link"];
  const missingProperties: { [key: string]: any } = {
    name: 0,
    price: 0,
    link: 0,
    image: 0,
  };

  if (products.length > 0)
    console.log(
      "extractProducts: Products cnt ",
      products.length,
      "Product: ",
      JSON.stringify(
        products[Math.floor(Math.random() * products.length - 1)],
        null,
        2
      )
    );
  const validProductCount = products.reduce((count, product) => {
    const isValid = properties.every((prop) => {
      if (product[prop] === "") missingProperties[prop]++;
      return product[prop] !== "";
    });
    return count + (isValid ? 1 : 0);
  }, 0);
  console.log("missingProperties:", missingProperties);

  const totalProducts = products.length;
  const validPercentage = (validProductCount / totalProducts) * 100;

  const isAtLeast90PercentValid = validPercentage >= 90;
  console.log("isAtLeast90PercentValid:", isAtLeast90PercentValid);

  expect(isAtLeast90PercentValid).toBe(true);
  expect(products.length).toBe(productsPerPage);
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
    expect(products.length).toBeGreaterThanOrEqual(
      productsPerPageAfterLoadMore
    );
    if (products.length > 0)
      console.log("extractProductsFromSecondPage: ", products[0]);
  }
};

export const extractProductsFromSecondPageQueueless = async (
  pages = 5,
  url?: string
) => {
  const initialProductPageUrl =
    testParameters[shopDomain].initialProductPageUrl;
  const productsPerPageAfterLoadMore =
    testParameters[shopDomain].productsPerPageAfterLoadMore;
  const products: any[] = [];
  const addProductCb = async (product: any) => {
    if (!products.find((p) => p.link === product.link)) products.push(product);
  };
  if (page && shops && shops[shopDomain]) {
    await page.goto(url ? url : initialProductPageUrl);
    const result = await browseProductpages(
      page,
      shops[shopDomain],
      addProductCb,
      {
        name: "",
        link: "",
      },
      {
        pages,
        mainCategory: 0,
        subCategory: 0,
      }
    );
    if (result === "crawled") {
      console.log("Loaded more products:", products.length);
      expect(products.length).toBeGreaterThanOrEqual(
        productsPerPageAfterLoadMore
      );
      if (products.length > 0)
        console.log(
          "Total products: ",
          products.length,
          "extractProductsFromSecondPageQueueless: ",
          products[Math.floor(Math.random() * products.length - 1)]
        );
    } else {
      expect(1).toBe(2);
    }
  }
};

export const extractProductInfos = async (addProductInfo: any) => {
  if (page && shops && shops[shopDomain]) {
    const productPageUrl = testParameters[shopDomain].productPageUrl;
    await page.goto(productPageUrl);
    return await queryProductPageQueue(page, {
      shop: shops[shopDomain],
      addProductInfo,
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
      pageInfo: {
        name: "",
        link: productPageUrl,
      },
      limit: {
        pages: 5,
        mainCategory: 0,
        subCategory: 0,
      },
    });
  }
};

export const querySellerInfos = async (addProductInfo: any, ean: string) => {
  if (page && shops && shops[shopDomain]) {
    return await querySellerInfosQueue(page, {
      shop: shops[shopDomain],
      addProductInfo,
      query: {
        brand: { key: "", value: "" },
        year: { min: 0, max: 0 },
        model: { key: "", value: "" },
        category: "",
        product: {
          value: ean,
          key: ean,
        },
      },
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
      pageInfo: {
        name: "",
        link: shops[shopDomain].entryPoints[0].url,
      },
      limit: {
        pages: 5,
        mainCategory: 0,
        subCategory: 0,
      },
    });
  }
};

export const queryEansOnEby = async (
  addProduct: any,
  onNotFound: any,
  isFinished: any,
  ean: string
) => {
  if (page && shops && shops[shopDomain]) {
    const query = {
      brand: { key: "", value: "" },
      year: { min: 0, max: 0 },
      model: { key: "", value: "" },
      category: "",
      product: {
        value: ean,
        key: ean,
      },
    };
    await page.goto(
      queryURLBuilder(shops[shopDomain].queryUrlSchema || [], query).url
    );
    return await queryEansOnEbyQueue(page, {
      shop: shops[shopDomain],
      addProduct,
      isFinished,
      query,
      onNotFound,
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
      pageInfo: {
        name: "",
        link: shops[shopDomain].entryPoints[0].url,
      },
      limit: {
        pages: 5,
        mainCategory: 0,
        subCategory: 0,
      },
    });
  }
};

export const queryEbayCategory = async (addProductInfo: any, ean: string) => {
  if (page && shops && shops[shopDomain]) {
    return await querySellerInfosQueue(page, {
      shop: shops[shopDomain],
      addProductInfo,
      query: {
        brand: { key: "", value: "" },
        year: { min: 0, max: 0 },
        model: { key: "", value: "" },
        category: "",
        product: {
          value: ean,
          key: ean,
        },
      },
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
      pageInfo: {
        name: "",
        link: shops[shopDomain].entryPoints[0].url,
      },
      limit: {
        pages: 5,
        mainCategory: 0,
        subCategory: 0,
      },
    });
  }
};

export const queryAznListing = async (addProductInfo: any, offer: string) => {
  if (page && shops && shops[shopDomain]) {
    await page.goto(offer);
    return await lookupProductQueue(page, {
      shop: shops[shopDomain],
      addProductInfo,
      query: {
        brand: { key: "", value: "" },
        year: { min: 0, max: 0 },
        model: { key: "", value: "" },
        category: "",
        product: {
          value: "",
          key: "",
        },
      },
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
      pageInfo: {
        name: "",
        link: offer,
      },
      limit: {
        pages: 5,
        mainCategory: 0,
        subCategory: 0,
      },
    });
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
