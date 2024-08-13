import queryEansOnEby from "../src/services/queryEansOnEby.js";

const task = {
  _id: "6638824827e8707aa568b4c3",
  type: "QUERY_EANS_EBY",
  id: `query_eans_eby`,
  proxyType: "mix",
  productLimit: 20,
  executing: false,
  lastCrawler: [],
  test: false,
  maintenance: false,
  concurreny: 4,
  recurrent: true,
  completed: false,
  completedAt: "",
  createdAt: "2024-06-18T07:10:51.942Z",
  limit: {
    mainCategory: 0,
    subCategory: 0,
    pages: 0,
  },
};

queryEansOnEby(task).then((r) => {
  console.log(JSON.stringify(r, null, 2));
  process.exit(0);
});
