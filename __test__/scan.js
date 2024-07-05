import { sub } from "date-fns";
import scan from "../src/services/scan.js";

const shopDomain = "mindfactory.de";

const today = new Date();
const productLimit = 500;
const yesterday = sub(today, { days: 1 });

const task = {
  _id: "661a785dc801f69f2beb16d9",
  type: "CRAWL_SHOP",
  id: `crawl_shop_${shopDomain}_1_of_4`,
  shopDomain,
  limit: {
    mainCategory: 2,
    subCategory: 100,
    pages: 10,
  },
  categories: [
    {
      name: "Neu",
      link: "https://www.reichelt.de/?PAGE=2",
    },
    {
      name: "SALE",
      link: "https://www.reichelt.de/sale-l2568.html",
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

scan(task)
  .then((r) => console.log(JSON.stringify(r, null, 2)))
  .catch((e) => console.log(e));
