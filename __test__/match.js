const task = {
  _id: "661a78dbc9c982a8567efac1",
  type: "MATCH_PRODUCTS",
  id: "lookup_shop_voelkner.de",
  shopDomain: "voelkner.de",
  productLimit: 1,
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
  result: {
    products_cnt: 1000,
    endTime: "2024-04-14T14:12:22.735Z",
    elapsedTime: "1.11 h",
    crawledPages: 1992,
  },
  retry: 0,
  test: true,
  extendedLookUp: true,
  startShops: [
    {
      d: "idealo.de",
      prefix: "i_",
      name: "Idealo",
    },
  ],
};

match(task).then();
