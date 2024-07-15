import crawlAznListingsWithSellercentral from "../src/services/crawlAznListingsWithSellerCentral.js";

const shop = "alternate.de";
const task = {
  _id: "6638824827e8707aa568b4c3",
  type: "CRAWL_AZN_LISTINGS",
  id: `crawl_azn_listings_${shop}`,
  shopDomain: shop,
  productLimit: 20,
  executing: false,
  browserConcurrency: 5,
  concurrency: 1,
  lastCrawler: [],
  test: false,
  maintenance: false,
  recurrent: true,
  completed: false,
  startedAt: "2024-04-28T08:51:42.170Z",
  completedAt: "",
  createdAt: "2024-05-06T07:10:51.942Z",
  limit: {
    mainCategory: 0,
    subCategory: 0,
    pages: 0,
  },
};

crawlAznListingsWithSellercentral(task).then((r) => {
  console.log(JSON.stringify(r, 2, null));
  process.exit(0);
});
