import { findArbispotterProducts } from "../db/util/crudArbispotterProduct.js";
import { getTasks } from "../db/util/tasks.js";
import { getArbispotterDb } from "../db/mongo.js";
import { getAllShopsAsArray } from "../db/util/shops.js";
import { ObjectId } from "@dipmaxtech/clr-pkg";

const taskIdScraperMap = {
  ean_taskId: ["CRAWL_EAN"],
  info_taskId: ["LOOKUP_INFO"],
  dealAznTaskId: ["DEALS_ON_AZN"],
  dealEbyTaskId: ["DEALS_ON_EBY"],
  eby_taskId: ["CRAWL_EBY_LISTINGS", "QUERY_EANS_EBY"],
  azn_taskId: ["CRAWL_AZN_LISTINGS"],
  cat_taskId: ["LOOKUP_CATEGORY"],
};

const problems = {
  CRAWL_EAN: 0,
  LOOKUP_INFO: 0,
  DEALS_ON_AZN: 0,
  DEALS_ON_EBY: 0,
  CRAWL_EBY_LISTINGS: 0,
  CRAWL_AZN_LISTINGS: 0,
  LOOKUP_CATEGORY: 0,
  QUERY_EANS_EBY: 0,
  MATCH_TITLES: 0,
  DETECT_QUANTITY: 0,
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

export const buildQuery = (taskIds) => {
  return {
    $or: taskIds.map((taskId) => ({
      [taskId]: { $exists: true, $ne: "" },
    })),
  };
};

const resetTaskIds = async () => {
  const spotter = await getArbispotterDb();
  const shops = await getAllShopsAsArray();
  const tasks = await getTasks();
  const activeShops = shops.filter((shop) => shop.active);
  activeShops.push({ d: "sales", _id: new ObjectId() });
  for (let index = 0; index < activeShops.length; index++) {
    const shop = activeShops[index];

    const total = await spotter
      .collection(shop.d)
      .countDocuments(buildQuery(taskIds));
    console.log("Processing shop:", shop.d);
    let count = 0;
    let cnt = 0;
    const batchSize = 3000;
    while (count < total) {
      const spotterBulkWrites = [];
      const products = await findArbispotterProducts(
        shop.d,
        buildQuery(taskIds),
        batchSize
      );
      if (products.length) {
        products.map((p) => {
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
            problems.LOOKUP_INFO++;
            update["$unset"] = { ...update["$unset"], info_taskId: "" };
          }

          if (
            p.dealAznTaskId &&
            !isTaskRunning(tasks, p.dealAznTaskId, "dealAznTaskId")
          ) {
            problems.DEALS_ON_AZN++;
            update["$unset"] = { ...update["$unset"], dealAznTaskId: "" };
          }

          if (
            p.dealEbyTaskId &&
            !isTaskRunning(tasks, p.dealEbyTaskId, "dealEbyTaskId")
          ) {
            problems.DEALS_ON_EBY++;
            update["$unset"] = { ...update["$unset"], dealEbyTaskId: "" };
          }

          if (
            p.eby_taskId &&
            !isTaskRunning(tasks, p.eby_taskId, "eby_taskId")
          ) {
            problems.CRAWL_EBY_LISTINGS++;
            problems.QUERY_EANS_EBY++;
            update["$unset"] = { ...update["$unset"], eby_taskId: "" };
          }

          if (
            p.azn_taskId &&
            !isTaskRunning(tasks, p.azn_taskId, "azn_taskId")
          ) {
            problems.CRAWL_AZN_LISTINGS++;
            update["$unset"] = { ...update["$unset"], azn_taskId: "" };
          }

          if (
            p.cat_taskId &&
            !isTaskRunning(tasks, p.cat_taskId, "cat_taskId")
          ) {
            problems.LOOKUP_CATEGORY++;
            update["$unset"] = { ...update["$unset"], cat_taskId: "" };
          }

          if (
            p.nm_batchId &&
            !isAiTaskRunning(tasks, p.nm_batchId, "nm_batchId")
          ) {
            problems.MATCH_TITLES++;
            if (p.nm_prop === "is_progress") {
              update["$unset"] = { ...update["$unset"], nm_prop: "" };
            }
            update["$unset"] = { ...update["$unset"], nm_batchId: "" };
          }

          if (
            p.qty_batchId &&
            !isAiTaskRunning(tasks, p.qty_batchId, "qty_batchId")
          ) {
            problems.DETECT_QUANTITY++;
            if (p.qty_prop === "is_progress") {
              update["$unset"] = { ...update["$unset"], qty_prop: "" };
            }
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
        if (spotterBulkWrites.length > 0) {
          const result = await spotter
            .collection(shop.d)
            .bulkWrite(spotterBulkWrites);
          console.log(shop.d, cnt, " Result:", result);
        }
        count += products.length;
      } else {
        console.log(`Done ${shop.d}`);
      }

      console.log("Processing batch:", cnt, "count", count, " from ", total);
      cnt++;
    }
  }
};

resetTaskIds().then((r) => {
  console.log("Problems:", JSON.stringify(problems, null, 2));
  process.exit(0);
});
