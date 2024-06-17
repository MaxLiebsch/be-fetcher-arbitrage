import eanLookup from "../src/services/eanLookup.js";

const task = {
  _id: "6638824827e8707aa568b4c3",
  type: "LOOKUP_EAN",
  id: `lookup_ean`,
  proxyType: "mix",
  productLimit: 5000,
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

eanLookup(task).then();
