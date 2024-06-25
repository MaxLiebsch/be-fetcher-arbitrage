import { sub } from "date-fns";
import crawl from "../src/services/crawl.js";

const shopDomain = "cyberport.de";

const today = new Date();
const productLimit = 20;
const yesterday = sub(today, { days: 1 });

const task = {
  _id: "661a785dc801f69f2beb16d9",
  type: "CRAWL_SHOP",
  id: `crawl_shop_${shopDomain}_1_of_4`,
  shopDomain,
  limit: {
    mainCategory: 9,
    subCategory: 100,
    pages: 2,
  },
  categories: [
    {
      "name": "Notebook",
      "link": "https://www.cyberport.de/notebook-und-tablet.html"
    },
    {
      "name": "PC&Zubehör",
      "link": "https://www.cyberport.de/pc-und-zubehoer.html"
    }
  ],
  recurrent: true,
  executing: false,
  completed: true,
  createdAt: "2024-04-13T12:19:41.168Z",
  errored: false,
  startedAt: yesterday.toISOString(),
  completedAt: yesterday.toISOString(),
  productLimit,
  retry: 0,
  maintenance: false,
  lastCrawler: [],
  weekday: today.getDay(),
};

crawl(task)
  .then((r) => console.log(JSON.stringify(r, null, 2)))
  .catch((e) => console.log(e));
