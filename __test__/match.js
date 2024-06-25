import match from "../src/services/match.js";
const domain = 'cyberport.de'
const task = {
  _id: "661a78dbc9c982a8567efac1",
  type: "MATCH_PRODUCTS",
  id: `"match_products_${domain}`,
  shopDomain: domain,
  productLimit: 20,
  executing: true,
  recurrent: true,
  completed: false,
  errored: false,
  startedAt: "2024-04-14T19:22:11.479Z",
  completedAt: "2024-04-14T14:12:23.386Z",
  createdAt: "2024-04-13T12:21:47.620Z",
  limit: {
    mainCategory: 0,
    subCategory: 0,
    pages: 0,
  },
  maintenance: false,
  lastCrawler: "love",
  reason: "COMPLETED",
  retry: 0,
  extendedLookUp: true,
  startShops: [
    {
      d: "idealo.de",
      prefix: "i_",
      name: "Idealo",
    },
  ],
};

match(task).then((r) => {
  console.log(r);
});
