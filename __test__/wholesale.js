import { ObjectId } from "mongodb";
import wholesale from "../src/services/wholesale.js";
const task = {
  _id: new ObjectId("664dbcf154d606e2c27d70ac"),
  type: "WHOLESALE_SEARCH",
  recurrent: false,
  startedAt: "2024-05-22T11:36:24.703Z",
  completedAt: "2024-05-22T11:36:14.274Z",
  maintenance: false,
  lastCrawler: [],
  productLimit: 20,
  userId: "me",
  progress: {
    total: 1,
    pending: 1,
  },
  executing: true,
  completed: true,
};

const main = async () => {
  return wholesale(task);
};

main().then((r) => console.log(r));
