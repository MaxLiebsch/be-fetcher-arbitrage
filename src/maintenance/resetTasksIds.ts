import { findProducts } from "../db/util/crudProducts";
import { getTasks } from "../db/util/tasks";
import { getProductsCol } from "../db/mongo";
import { getActiveShops } from "../db/util/shops";

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
  WHOLESALE_SEARCH: 0,
  WHOLESALE_EBY_SEARCH: 0,
  LOOKUP_CATEGORY: 0,
  QUERY_EANS_EBY: 0,
  MATCH_TITLES: 0,
  DETECT_QUANTITY: 0,
};
const idsMap = new Map<string, number>();

const addToIdMap = (id: string) => {
  if (idsMap.has(id)) {
    idsMap.set(id, idsMap.get(id)! + 1);
  } else {
    idsMap.set(id, 1);
  }
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

export const isTaskRunning = (tasks: any, taskId: any, taskIdKey: any) => {
  const clr = taskId.split(":")[0];
  const taskTypes = (taskIdScraperMap as any)[taskIdKey];
  const foundTasks = tasks.filter((t: any) => taskTypes.includes(t.type));
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

export const isAiTaskRunning = (tasks: any, batchId: any, batchIdKey: any) => {
  const batchTypes = (batchIdAiTaskMap as any)[batchIdKey];
  const foundTasks = tasks.filter((t: any) => batchTypes.includes(t.type));
  for (let i = 0; i < foundTasks.length; i++) {
    const t = foundTasks[i];
    if (t.batches.some((b: any) => b.batchId === batchId)) {
      return true;
    }
  }
  return false;
};

export const buildQuery = (taskIds: string[], domain: string) => {
  return {
    sdmn: domain,
    $or: taskIds.map((taskId) => ({
      [taskId]: { $exists: true, $ne: "" },
    })),
  };
};

const resetTaskIds = async () => {
  const productCol = await getProductsCol();
  const shops = await getActiveShops();
  const tasks = await getTasks();
  if (!shops) {
    console.log("No tasks found");
    return;
  }

  for (let index = 0; index < shops.length; index++) {
    const shop = shops[index];

    const total = await productCol.countDocuments(buildQuery(taskIds, shop.d));
    console.log("Processing shop:", shop.d);
    let count = 0;
    let cnt = 0;
    const batchSize = 3000;
    while (count < total) {
      const spotterBulkWrites: any[] = [];
      const products = await findProducts(
        buildQuery(taskIds, shop.d),
        batchSize
      );
      if (products.length) {
        products.map((p) => {
          let update: any = {};
          if (
            p.ean_taskId &&
            !isTaskRunning(tasks, p.ean_taskId, "ean_taskId")
          ) {
            addToIdMap(p.ean_taskId);
            update["$unset"] = { ean_taskId: "" };
          }
          if (
            p.info_taskId &&
            !isTaskRunning(tasks, p.info_taskId, "info_taskId")
          ) {
            addToIdMap(p.info_taskId);
            problems.LOOKUP_INFO++;
            update["$unset"] = { ...update["$unset"], info_taskId: "" };
          }

          if (
            p.dealAznTaskId &&
            !isTaskRunning(tasks, p.dealAznTaskId, "dealAznTaskId")
          ) {
            addToIdMap(p.dealAznTaskId);
            problems.DEALS_ON_AZN++;
            update["$unset"] = { ...update["$unset"], dealAznTaskId: "" };
          }

          if (
            p.dealEbyTaskId &&
            !isTaskRunning(tasks, p.dealEbyTaskId, "dealEbyTaskId")
          ) {
            addToIdMap(p.dealEbyTaskId);
            problems.DEALS_ON_EBY++;
            update["$unset"] = { ...update["$unset"], dealEbyTaskId: "" };
          }

          if (
            p.eby_taskId &&
            !isTaskRunning(tasks, p.eby_taskId, "eby_taskId")
          ) {
            addToIdMap(p.eby_taskId);
            problems.CRAWL_EBY_LISTINGS++;
            problems.QUERY_EANS_EBY++;
            update["$unset"] = { ...update["$unset"], eby_taskId: "" };
          }

          if (
            p.azn_taskId &&
            !isTaskRunning(tasks, p.azn_taskId, "azn_taskId")
          ) {
            addToIdMap(p.azn_taskId);
            problems.CRAWL_AZN_LISTINGS++;
            update["$unset"] = { ...update["$unset"], azn_taskId: "" };
          }

          if (
            p.cat_taskId &&
            !isTaskRunning(tasks, p.cat_taskId, "cat_taskId")
          ) {
            addToIdMap(p.cat_taskId);
            problems.LOOKUP_CATEGORY++;
            update["$unset"] = { ...update["$unset"], cat_taskId: "" };
          }

          if (
            p.nm_batchId &&
            !isAiTaskRunning(tasks, p.nm_batchId, "nm_batchId")
          ) {
            addToIdMap(p.nm_batchId);
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
            addToIdMap(p.qty_batchId);
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
          const result = await productCol.bulkWrite(spotterBulkWrites);
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
  console.log("Ids:", JSON.stringify(idsMap, null, 2));
  process.exit(0);
});
