import { sub } from "date-fns";
import crawl from "../src/services/crawl.js";
import { deleteAllArbispotterProducts } from "../src/services/db/util/crudArbispotterProduct.js";

const shopDomain = "gamestop.de";

const today = new Date();
const productLimit = 50;
const yesterday = sub(today, { days: 1 });

const task = {
  _id: "661a785dc801f69f2beb16d9",
  type: "CRAWL_SHOP",
  id: `crawl_shop_${shopDomain}_1_of_4`,
  shopDomain,
  limit: {
    mainCategory: 9,
    subCategory: 100,
    pages: 50,
  },
  categories: [
    {
      name: "Abholung im Store",
      link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&shippingMethod=2",
      size: 4633,
    },
  ],
  recurrent: true,
  executing: false,
  completed: true,
  createdAt: "2024-04-13T12:19:41.168Z",
  startedAt: yesterday.toISOString(),
  completedAt: yesterday.toISOString(),
  productLimit,
  retry: 0,
  maintenance: false,
  lastCrawler: [],
  weekday: today.getDay(),
};

const main = async () => {
  await deleteAllArbispotterProducts(shopDomain);
  const r = await crawl(task);
  console.log(JSON.stringify(r, null, 2));
};
main();
