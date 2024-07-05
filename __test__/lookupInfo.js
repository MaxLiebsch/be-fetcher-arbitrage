import lookupInfo from "../src/services/lookupInfo.js";

const task = {
  _id: "6638824827e8707aa568b4c3",
  type: "LOOKUP_INFO",
  id: `lookup_info`,
  proxyType: "mix",
  productLimit: 20,
  executing: false,
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

lookupInfo(task).then((r) => {
  console.log(JSON.stringify(r, 2, null));
  process.exit(0);
});
