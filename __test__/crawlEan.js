import crawlEan from "../src/services/crawlEan.js";

const task = {
  _id: "6638824827e8707aa568b4c3",
  type: "CRAWL_EAN",
  id: `crawl_ean`,
  proxyType: "mix",
  productLimit: 20,
  executing: false,
  lastCrawler: [],
  test: false,
  maintenance: false,
  concurreny: 6,
  recurrent: true,
  completed: false,
  errored: false,
  completedAt: "",
  createdAt: "2024-06-18T07:10:51.942Z",
  limit: {
    mainCategory: 0,
    subCategory: 0,
    pages: 0,
  },
};

crawlEan(task).then((r) => {
  console.log(JSON.stringify(r, 2, null));
  process.exit(0);
});
