import crawl from "../src/services/crawl.js";

const task = {
  _id: "661a785dc801f69f2beb16d9",
  type: "CRAWL_SHOP",
  id: "crawl_shop_voelkner.de_1_of_4",
  shopDomain: "voelkner.de",
  limit: {
    mainCategory: 2,
    subCategory: 100,
    pages: 2,
  },
  categories: [
    {
      name: "Haus & Garten",
      link: "https://www.voelkner.de/categories/13146/haus-garten.html",
    },
    {
      name: "Beleuchtung",
      link: "https://www.voelkner.de/categories/13147/beleuchtung.html",
    },
  ],
  recurrent: true,
  executing: false,
  completed: true,
  createdAt: "2024-04-13T12:19:41.168Z",
  errored: false,
  startedAt: "2024-05-07T11:53:43.545Z",
  completedAt: "2024-05-07T11:54:26.079Z",
  productLimit: 500,
  retry: 0,
  maintenance: false,
  lastCrawler: [],
  weekday: 2,
};

crawl(task).then();
