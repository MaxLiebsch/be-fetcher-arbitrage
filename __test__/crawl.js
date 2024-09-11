import { sub } from "date-fns";
import crawl from "../src/services/crawl.js";
import { deleteAllArbispotterProducts } from "../src/db/util/crudArbispotterProduct.js";

const shopDomain = "reichelt.de";

const today = new Date();
const productLimit = 200;
const yesterday = sub(today, { days: 1 });

const task = {
  _id: "661a785dc801f69f2beb16d9",
  type: "CRAWL_SHOP",
  id: `crawl_shop_${shopDomain}_1_of_4`,
  shopDomain,
  proxyType: 'de',
  limit: {
    mainCategory: 9,
    subCategory: 100,
    pages: 50,
  },
  categories: [
    {
      name: "Neu",
      link: "https://www.reichelt.de/?PAGE=2",
      limit: {
        subCategories: 100,
        pages: 10,
      },
      productLimit: 20,
    },
    {
      name: "Sale",
      link: "https://www.reichelt.de/sale-l2568.html",
      limit: {
        subCategories: 100,
        pages: 10,
      },
      productLimit: 20,
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
