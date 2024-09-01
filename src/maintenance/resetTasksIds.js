import { findArbispotterProducts } from "../services/db/util/crudArbispotterProduct.js";
import { getTasks } from "../services/db/util/tasks.js";
import { getArbispotterDb } from "../services/db/mongo.js";
import { getAllShopsAsArray } from "../services/db/util/shops.js";

const taskIdScraperMap = {
  ean_taskId: ["CRAWL_EAN"],
  info_taskId: ["LOOKUP_INFO"],
  dealAznTaskId: ["DEALS_ON_AZN"],
  dealEbyTaskId: ["DEALS_ON_EBY"],
  eby_taskId: ["CRAWL_EBY_LISTINGS", "QUERY_EANS_EBY"],
  azn_taskId: ["CRAWL_AZN_LISTINGS"],
  cat_taskId: ["LOOKUP_CATEGORY"],
};
const taskIds = [
  "ean_taskId",
  "info_taskId",
  "dealAznTaskId",
  "dealEbyTaskId",
  "eby_taskId",
  "azn_taskId",
  "cat_taskId",
  "nm_batchId",
  "qty_batchId",
];

export const isTaskRunning = (tasks, taskId, taskIdKey) => {
  const clr = taskId.split(":")[0];
  const taskTypes = taskIdScraperMap[taskIdKey];
  const foundTasks = tasks.filter((t) => taskTypes.includes(t.type));
  for (let i = 0; i < foundTasks.length; i++) {
    const t = foundTasks[i];
    if (t.lastCrawler.includes(clr)) {
      return true;
    }
  }
  return false;
};

const batchIdAiTaskMap = {
  qty_batchId: ["DETECT_QUANTITY"],
  nm_batchId: ["MATCH_TITLES"],
};
const aiTaskIds = ["nm_batchId", "qty_batchId"];

export const isAiTaskRunning = (tasks, batchId, batchIdKey) => {
  const batchTypes = batchIdAiTaskMap[batchIdKey];
  const foundTasks = tasks.filter((t) => batchTypes.includes(t.type));
  for (let i = 0; i < foundTasks.length; i++) {
    const t = foundTasks[i];
    if (t.batches.some((b) => b.batchId === batchId)) {
      return true;
    }
  }
  return false;
};

const resetTaskIds = async () => {
  const spotter = await getArbispotterDb();
  const shops = await getAllShopsAsArray();
  const tasks = await getTasks();
  const activeShops = shops.filter((shop) => shop.active);
  activeShops.push({ d: "sales" });
  let count = 0;
  for (let index = 0; index < activeShops.length; index++) {
    const shop = activeShops[index];

    console.log("Processing shop:", shop.d);
    let cnt = 0;
    const batchSize = 3000;
    let hasMoreProducts = true;
    while (hasMoreProducts) {
      const spotterBulkWrites = [];
      const products = await findArbispotterProducts(
        shop.d,
        {
          $or: taskIds.map((taskId) => ({
            [taskId]: { $exists: true, $ne: "" },
          })),
        },
        batchSize,
        cnt
      );
      if (products.length) {
        products.map((p) => {
          count++;
          let update = {};
          if (
            p.ean_taskId &&
            !isTaskRunning(tasks, p.ean_taskId, "ean_taskId")
          ) {
            update["$unset"] = { ean_taskId: "" };
          }
          if (
            p.info_taskId &&
            !isTaskRunning(tasks, p.info_taskId, "info_taskId")
          ) {
            update["$unset"] = { ...update["$unset"], info_taskId: "" };
          }

          if (
            p.dealAznTaskId &&
            !isTaskRunning(tasks, p.dealAznTaskId, "dealAznTaskId")
          ) {
            update["$unset"] = { ...update["$unset"], dealAznTaskId: "" };
          }

          if (
            p.dealEbyTaskId &&
            !isTaskRunning(tasks, p.dealEbyTaskId, "dealEbyTaskId")
          ) {
            update["$unset"] = { ...update["$unset"], dealEbyTaskId: "" };
          }

          if (
            p.eby_taskId &&
            !isTaskRunning(tasks, p.eby_taskId, "eby_taskId")
          ) {
            update["$unset"] = { ...update["$unset"], eby_taskId: "" };
          }

          if (
            p.azn_taskId &&
            !isTaskRunning(tasks, p.azn_taskId, "azn_taskId")
          ) {
            update["$unset"] = { ...update["$unset"], azn_taskId: "" };
          }

          if (
            p.cat_taskId &&
            !isTaskRunning(tasks, p.cat_taskId, "cat_taskId")
          ) {
            update["$unset"] = { ...update["$unset"], cat_taskId: "" };
          }

          if (
            p.nm_batchId &&
            !isAiTaskRunning(tasks, p.nm_batchId, "nm_batchId")
          ) {
            update["$unset"] = { ...update["$unset"], nm_batchId: "" };
          }

          if (
            p.qty_batchId &&
            !isAiTaskRunning(tasks, p.qty_batchId, "qty_batchId")
          ) {
            update["$unset"] = { ...update["$unset"], qty_batchId: "" };
          }

          if (Object.keys(update).length > 0) {
            let spotterBulk = {
              updateOne: {
                filter: { _id: p._id },
                update,
              },
            };
            spotterBulkWrites.push(spotterBulk);
          }
        });
        if(spotterBulkWrites.length > 0) {
          const result = await spotter
            .collection(shop.d)
            .bulkWrite(spotterBulkWrites);
          console.log(shop.d, cnt, " Result:", result);
        }
      } else {
        console.log(`Done ${shop.d}`);
      }

      console.log(
        "Processing batch:",
        cnt,
        "count:",
        count,
        "hasMoreProducts: ",
        products.length === batchSize
      );
      hasMoreProducts = products.length === batchSize;
      cnt++;
    }
  }
};

resetTaskIds().then((r) => {
  process.exit(0);
});
