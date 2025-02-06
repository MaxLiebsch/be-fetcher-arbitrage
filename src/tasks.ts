import { ICategory, Shop, SubCategory } from "@dipmaxtech/clr-pkg";
import { CONCURRENCY } from "./constants";
import { getSiteMap } from "./db/mongo";
import { getAllShops } from "./db/util/shops";
import { addTask } from "./db/util/tasks";
import { sub } from "date-fns";
const shopDomains: string[] = ["mindfactory.de"];

const chunkSize = 2;
const productPages = 25;
const productLimitLookup = 500;

function chunkArray(array: [string, SubCategory][], chunkSize: number) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  // Check if the last chunk has only one item
  if (chunks.length > 1 && chunks[chunks.length - 1].length === 1) {
    // Merge the last item of the last chunk with the previous chunk
    const lastItem = chunks.pop(); // Remove and get the last chunk
    if (lastItem)
      chunks[chunks.length - 1] = chunks[chunks.length - 1].concat(lastItem);
  }
  return chunks;
}

export const createCrawlerTasks = async () => {
  const shops = await getAllShops(shopDomains);
  if (shops.length) {
    const promises = await Promise.all(
      shops.map(async (shop) => {
        return createCrawlTasks(shop, 15000);
      })
    );
    return promises;
  }
};

export const createScanMatchTasks = async (
  shopDomains: string[],
  match = true,
  additional = {}
) => {
  const shops = await getAllShops(shopDomains);
  if (shops.length) {
    return Promise.all(
      shops.map(async (shop) => {
        let task = {
          type: match ? "MATCH_PRODUCTS" : "SCAN_SHOP",
          id: `${match ? "match" : "scan"}_shop_${shop.d}`,
          shopDomain: shop.d,
          productLimit: match ? productLimitLookup : 0,
          executing: false,
          lastCrawler: [],
          test: false,
          maintenance: false,
          recurrent: match ? true : false,
          completed: false,
          errored: false,
          startedAt: "",
          completedAt: "",
          createdAt: new Date().toISOString(),
          limit: {
            mainCategory: match ? 0 : 15,
            subCategory: match ? 0 : 500,
            pages: 0,
          },
        };
        if (additional) {
          task = { ...task, ...additional };
        }
        return await addTask(task);
      })
    );
  }
};

export const createLookupTasks = async (additional = {}) => {
  const shops = await getAllShops(shopDomains);
  if (shops.length) {
    return Promise.all(
      shops.map(async (shop) => await createSingleCrawlAznListingsTask(shop.d))
    );
  }
};

export const createCrawlTasks = async (shop: Shop, maxProducts: number) => {
  const { d: shopDomain } = shop;
  const siteMap = await getSiteMap(shopDomain);
  if (siteMap) {
    const categories = Object.entries(
      siteMap.sitemap.subcategories
    ) as unknown as [string, SubCategory][];
    const productsPerCategory = Math.ceil(maxProducts / categories.length);
    const chunks = chunkArray(categories, chunkSize);
    return Promise.all(
      chunks.map(async (chunk, i) => {
        const task: any = {
          // ScrapeShopTask
          type: "CRAWL_SHOP",
          maintenance: false,
          initialized: false,
          test: false,
          id: `crawl_shop_${shopDomain}_${i + 1}_of_${chunks.length}`,
          shopDomain,
          limit: {
            mainCategory: chunks.length,
            subCategory: 100,
            pages: productPages,
          },
          categories: chunk.reduce<ICategory[]>((acc, category) => {
            acc.push({
              name: category[0],
              link: category[1].link,
            });
            return acc;
          }, []),
          recurrent: true,
          lastCrawler: [],
          visitedPages: [],
          executing: false,
          completed: false,
          createdAt: new Date().toISOString(),
          errored: false,
          cooldown: sub(new Date(), { days: 1 }).toISOString(),
          startedAt: "",
          completedAt: "",
          lastTotal: 0,
          estimatedTotal: chunk.length * productsPerCategory,
          productLimit: chunk.length * productsPerCategory,
        };
        return await addTask(task);
      })
    );
  }
};

export const createSingleCrawlAznListingsTask = async (shopDomain: string) => {
  let task = {
    type: "CRAWL_AZN_LISTINGS",
    id: `crawl_azn_listings_${shopDomain}`,
    shopDomain: shopDomain,
    productLimit: productLimitLookup,
    executing: false,
    lastCrawler: [],
    test: false,
    maintenance: false,
    recurrent: true,
    completed: false,
    errored: false,
    startedAt: "",
    concurrency: CONCURRENCY,
    completedAt: "",
    progress: {
      percentage: "",
      total: 0,
      pending: 0,
    },
    createdAt: new Date().toISOString(),
    limit: {
      mainCategory: 0,
      subCategory: 0,
      pages: 0,
    },
  };
  return await addTask(task);
};

export const createSingleMatchTask = async (shopDomain: string) => {
  let task = {
    type: "MATCH_PRODUCTS",
    id: `match_products_${shopDomain}`,
    shopDomain,
    productLimit: productLimitLookup,
    executing: false,
    lastCrawler: [],
    test: false,
    maintenance: false,
    recurrent: true,
    completed: false,
    extendedLookup: true,
    startShop: [
      {
        d: "idealo.de",
        prefix: "i_",
        name: "Idealo",
      },
    ],
    errored: false,
    startedAt: "",
    completedAt: "",
    createdAt: new Date().toISOString(),
    progress: {
      percentage: "",
      total: 0,
      pending: 0,
    },
    limit: {
      mainCategory: 0,
      subCategory: 0,
      pages: 0,
    },
  };
  return await addTask(task);
};

export const createDailySalesTask = async (
  shopDomain: string,
  categories: ICategory[],
  productLimit: number
) => {
  const task: any = {
    // DailySalesTask
    type: "DAILY_SALES",
    id: `daily_sales_${shopDomain}`,
    shopDomain,
    executing: false,
    productLimit,
    lastCrawler: [],
    categories,
    test: false,
    maintenance: false,
    recurrent: true,
    completed: false,
    errored: false,
    lastTotal: 0,
    estimatedProducts: productLimit,
    actualProductLimit: productLimit,
    startedAt: sub(new Date(), { days: 1 }).toISOString(),
    completedAt: sub(new Date(), { days: 1 }).toISOString(),
    cooldown: sub(new Date(), { days: 1 }).toISOString(),
    progress: {
      crawlEan: [],
      lookupInfo: [],
      lookupCategory: [],
      queryEansOnEby: [],
      aznListings: [],
      ebyListings: [],
    },
    browserConfig: {
      crawlShop: {
        limit: {
          mainCategory: 2,
          subCategory: 100,
          pages: 10,
        },
        concurrency: 4,
      },
      crawlEan: {
        productLimit: 20,
        concurrency: 4,
      },
      lookupInfo: {
        concurrency: 1,
        productLimit: 20,
        browserConcurrency: 6,
      },
      queryEansOnEby: {
        concurrency: 4,
        productLimit: 20,
      },
      lookupCategory: {
        concurrency: 4,
        productLimit: 20,
      },
      crawlAznListings: {
        concurrency: 4,
        productLimit: 20,
      },
      crawlEbyListings: {
        concurrency: 4,
        productLimit: 20,
      },
    },
    retry: 0,
  };
  return await addTask(task);
};
