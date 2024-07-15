import crawlEbyListings from "../src/services/crawlEbyListings.js";

const shop = "alternate.de";
const task = {
  _id: "6688071a83a678cb6df590ef",
  type: "CRAWL_EBY_LISTINGS",
  id: `crawl_eby_listings_${shop}`,
  shopDomain: "alternate.de",
  productLimit: 20,
  executing: false,
  lastCrawler: [],
  test: false,
  maintenance: true,
  recurrent: true,
  completed: false,
  startedAt: "",
  createdAt: "",
  completedAt: "",
  limit: {
    mainCategory: 0,
    subCategory: 0,
    pages: 0,
  },
  retry: 0,
  concurrency: 4,
};

crawlEbyListings(task).then((r) => {
  console.log(JSON.stringify(r, 2, null));
  process.exit(0);
});
