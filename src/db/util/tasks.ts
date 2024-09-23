import { getCrawlDataDb, hostname, tasksCollectionName } from "../mongo.js";
import { countPendingProductsForMatch } from "./match/getMatchProgress.js";
import { findTasksQuery } from "./queries.js";
import { getMissingEanShops } from "./crawlEan/getMissingEanShops.js";
import { getUnmatchedQueryEansOnEbyShops } from "./queryEansOnEby/getUnmatchedQueryEansOnEbyShops.js";
import { getUnmatchedEanShops } from "./lookupInfo/getUnmatchedEanShops.js";
import { getMissingEbyCategoryShops } from "./lookupCategory/getMissingEbyCategoryShops.js";
import { countPendingProductsForWholesaleSearch } from "./wholesaleSearch/getWholesaleProgress.js";
import {
  MINIMUM_PENDING_PRODUCTS,
  ObjectId,
  TaskTypes,
} from "@dipmaxtech/clr-pkg";
import { UTCDate } from "@date-fns/utc";
import { getOutdatedDealsOnAznShops } from "./deals/daily/azn/getOutdatedDealsOnAznShops.js";
import { getOutdatedNegMarginEbyListingsPerShop } from "./deals/weekly/eby/getOutdatedNegMarginEbyListingsPerShop.js";
import { getOutdatedNegMarginAznListingsPerShop } from "./deals/weekly/azn/getOutdatedNegMarginAznListingsPerShop.js";
import { getOutdatedDealsOnEbyShops } from "./deals/daily/eby/getOutdatedDealsOnEbyShops.js";
import { TASK_TYPES } from "../../util/taskTypes.js";
import { MatchProductsTask, Tasks } from "../../types/tasks/Tasks.js";
import { PendingShops } from "../../types/shops.js";
import { COOLDOWN, COOLDOWN_LONG } from "../../constants.js";
import { Filter, UpdateFilter } from "mongodb";
import { logGlobal } from "../../util/logger.js";

const handleComulativTasks = async (
  task: Tasks,
  pendingShops: PendingShops,
  cooldown: string
) => {
  if (
    pendingShops.length > 0 &&
    pendingShops.some((info) => info.pending > MINIMUM_PENDING_PRODUCTS)
  ) {
    return task;
  } else {
    await updateTask(task._id, {
      $set: {
        executing: false,
        cooldown,
      },
      $pull: { lastCrawler: hostname },
    });
    return null;
  }
};

const handleSingleTask = async (
  task: Tasks,
  pending: number,
  cooldown: string
) => {
  if (pending === 0) {
    await updateTask(task._id, {
      $set: {
        executing: false,
        cooldown,
      },
      $pull: { lastCrawler: hostname },
    });
    return null;
  } else {
    return task;
  }
};

export const getNewTask = async (): Promise<Tasks | null | undefined> => {
  const { prioQuery, query, fallbackQuery, update } = findTasksQuery();
  const collectionName = tasksCollectionName;
  const db = await getCrawlDataDb();
  const taskCollection = db.collection<Tasks>(collectionName);
  const coolDownFactor = process.env.DEBUG ? 1000 * 60 * 2 : COOLDOWN;
  const cooldown = new Date(Date.now() + coolDownFactor).toISOString(); // 30 min in future

  const prioTask = await taskCollection.findOneAndUpdate(prioQuery, update, {
    returnDocument: "after",
  });
  console.log("Prioritytask: ", prioTask?.type || "no task");
  prioTask?.type &&
    logGlobal("Prioritytask:" + prioTask?.type + " " + prioTask?.id);
  if (prioTask) {
    if (prioTask.type === TASK_TYPES.DEALS_ON_EBY && "proxyType" in prioTask) {
      const { pendingShops, shops } = await getOutdatedDealsOnEbyShops(
        prioTask.proxyType
      );
      logGlobal("DEALS_ON_EBY: pendingShops:" + pendingShops.length);
      return await handleComulativTasks(prioTask, pendingShops, cooldown);
    }
    if (prioTask.type === TASK_TYPES.DEALS_ON_AZN && "proxyType" in prioTask) {
      const { pendingShops, shops } = await getOutdatedDealsOnAznShops(
        prioTask.proxyType
      );
      logGlobal("DEALS_ON_AZN: pendingShops:" + pendingShops.length);
      return await handleComulativTasks(prioTask, pendingShops, cooldown);
    }
    return prioTask;
  }

  const primaryTask = await taskCollection.findOneAndUpdate(query, update, {
    returnDocument: "after",
  });
  primaryTask?.type &&
    logGlobal("Primary:task:" + primaryTask?.type + " " + primaryTask?.id);
  console.log("primaryTask ", primaryTask?.type || "no task");
  if (primaryTask) {
    if (primaryTask.type === TASK_TYPES.SCAN_SHOP) {
      return primaryTask;
    }
    if (primaryTask.type === TASK_TYPES.WHOLESALE_SEARCH) {
      const pending = await countPendingProductsForWholesaleSearch(
        primaryTask._id,
        "WHOLESALE_SEARCH"
      );
      logGlobal("WHOLESALE_SEARCH: pending:" + pending);
      return await handleSingleTask(primaryTask, pending, cooldown);
    }
    if (primaryTask.type === TASK_TYPES.WHOLESALE_EBY_SEARCH) {
      const pending = await countPendingProductsForWholesaleSearch(
        primaryTask._id,
        "WHOLESALE_EBY_SEARCH"
      );
      logGlobal("WHOLESALE_EBY_SEARCH: pending:" + pending);
      return await handleSingleTask(primaryTask, pending, cooldown);
    }
    if (
      primaryTask.type === TASK_TYPES.CRAWL_EAN &&
      "proxyType" in primaryTask
    ) {
      const { pendingShops, shops } = await getMissingEanShops(
        primaryTask.proxyType
      );
      logGlobal("CRAWL_EAN: pendingShops:" + pendingShops.length);
      return await handleComulativTasks(primaryTask, pendingShops, cooldown);
    }
    if (primaryTask.type === TASK_TYPES.LOOKUP_INFO) {
      const { pendingShops, shops } = await getUnmatchedEanShops();
      logGlobal("LOOKUP_INFO: pendingShops:" + pendingShops.length);
      return await handleComulativTasks(primaryTask, pendingShops, cooldown);
    }
    if (primaryTask.type === TASK_TYPES.QUERY_EANS_EBY) {
      const { pendingShops, shops } = await getUnmatchedQueryEansOnEbyShops();
      logGlobal("QUERY_EANS_EBY: pendingShops:" + pendingShops.length);
      return await handleComulativTasks(primaryTask, pendingShops, cooldown);
    }
    if (primaryTask.type === TASK_TYPES.MATCH_PRODUCTS) {
      const shopProductCollectionName = (primaryTask as MatchProductsTask)
        .shopDomain;
      const pending = await countPendingProductsForMatch(
        shopProductCollectionName,
        false
      );
      logGlobal("MATCH_PRODUCTS: pending:" + pending);
      return await handleSingleTask(primaryTask, pending, cooldown);
    }
    if (
      primaryTask.type === TASK_TYPES.NEG_AZN_DEALS &&
      "proxyType" in primaryTask
    ) {
      const { pendingShops, shops } =
        await getOutdatedNegMarginAznListingsPerShop(primaryTask.proxyType);
      logGlobal("NEG_AZN_DEALS: pendingShops:" + pendingShops.length);
      return await handleComulativTasks(primaryTask, pendingShops, cooldown);
    }
    if (
      primaryTask.type === TASK_TYPES.NEG_EBY_DEALS &&
      "proxyType" in primaryTask
    ) {
      const { pendingShops, shops } =
        await getOutdatedNegMarginEbyListingsPerShop(primaryTask.proxyType);
      logGlobal("NEG_EBY_DEALS: pendingShops:" + pendingShops.length);
      return await handleComulativTasks(primaryTask, pendingShops, cooldown);
    }
    if (
      primaryTask.type === TASK_TYPES.LOOKUP_CATEGORY &&
      "proxyType" in primaryTask
    ) {
      const { pendingShops, shops } = await getMissingEbyCategoryShops();
      logGlobal("LOOKUP_CATEGORY: pendingShops:" + pendingShops.length);
      return await handleComulativTasks(primaryTask, pendingShops, cooldown);
    }
  } else {
    //fallback
    const fallbackTask = await taskCollection.findOneAndUpdate(
      fallbackQuery,
      update,
      {
        returnDocument: "after",
      }
    );
    fallbackTask?.type &&
      logGlobal("Fallbacktask:" + fallbackTask?.type + " " + fallbackTask?.id);

    console.log("FallbackTask ", fallbackTask?.type || "no task");
    const coolDownFactor = process.env.DEBUG ? 1000 * 60 * 2 : COOLDOWN_LONG; // 60 min in future
    const cooldown = new UTCDate(Date.now() + coolDownFactor).toISOString();
    if (fallbackTask) {
      const { _id, type } = fallbackTask;
      if (type === TASK_TYPES.WHOLESALE_SEARCH) {
        const pending = await countPendingProductsForWholesaleSearch(
          _id,
          "WHOLESALE_SEARCH"
        );
        logGlobal("WHOLESALE_SEARCH: pending:" + pending);
        return await handleSingleTask(fallbackTask, pending, cooldown);
      }
      if (type === TASK_TYPES.WHOLESALE_EBY_SEARCH) {
        const pending = await countPendingProductsForWholesaleSearch(
          _id,
          "WHOLESALE_EBY_SEARCH"
        );
        logGlobal("WHOLESALE_EBY_SEARCH: pending:" + pending);
        return await handleSingleTask(fallbackTask, pending, cooldown);
      }
      if (type === TASK_TYPES.MATCH_PRODUCTS) {
        const shopProductCollectionName = (fallbackTask as MatchProductsTask)
          .shopDomain;
        const pending = await countPendingProductsForMatch(
          shopProductCollectionName,
          false
        );
        logGlobal("MATCH_PRODUCTS: pending:" + pending);
        return await handleSingleTask(fallbackTask, pending, cooldown);
      }
      if (type === TASK_TYPES.QUERY_EANS_EBY) {
        const { pendingShops, shops } = await getUnmatchedQueryEansOnEbyShops();
        logGlobal("QUERY_EANS_EBY: pendingShops:" + pendingShops.length);
        return await handleComulativTasks(fallbackTask, pendingShops, cooldown);
      }
      if (type === TASK_TYPES.CRAWL_EAN && "proxyType" in fallbackTask) {
        const { pendingShops, shops } = await getMissingEanShops(
          fallbackTask.proxyType
        );
        logGlobal("CRAWL_EAN: pendingShops:" + pendingShops.length);
        return await handleComulativTasks(fallbackTask, pendingShops, cooldown);
      }
      if (type === TASK_TYPES.NEG_AZN_DEALS && "proxyType" in fallbackTask) {
        const { pendingShops, shops } =
          await getOutdatedNegMarginAznListingsPerShop(fallbackTask.proxyType);
        logGlobal("NEG_AZN_DEALS: pendingShops:" + pendingShops.length);
        return await handleComulativTasks(fallbackTask, pendingShops, cooldown);
      }
      if (type === TASK_TYPES.NEG_EBY_DEALS && "proxyType" in fallbackTask) {
        const { pendingShops, shops } =
          await getOutdatedNegMarginEbyListingsPerShop(fallbackTask.proxyType);
        logGlobal("NEG_EBY_DEALS: pendingShops:" + pendingShops.length);
        return await handleComulativTasks(fallbackTask, pendingShops, cooldown);
      }
      if (type === TASK_TYPES.CRAWL_EAN && "proxyType" in fallbackTask) {
        const { pendingShops, shops } = await getMissingEanShops(
          fallbackTask.proxyType
        );
        logGlobal("CRAWL_EAN: pendingShops:" + pendingShops.length);
        return await handleComulativTasks(fallbackTask, pendingShops, cooldown);
      }
      if (type === TASK_TYPES.LOOKUP_INFO) {
        const { pendingShops, shops } = await getUnmatchedEanShops();
        logGlobal("LOOKUP_INFO: pendingShops:" + pendingShops.length);
        return await handleComulativTasks(fallbackTask, pendingShops, cooldown);
      }
      if (type === TASK_TYPES.LOOKUP_CATEGORY) {
        const { pendingShops, shops } = await getMissingEbyCategoryShops();
        logGlobal("LOOKUP_CATEGORY: pendingShops:" + pendingShops.length);
        return await handleComulativTasks(fallbackTask, pendingShops, cooldown);
      }
    }
    return null;
  }
};

export const findTasks = async (query: Filter<Tasks>, test = false) => {
  const collectionName = test
    ? `test_${tasksCollectionName}`
    : tasksCollectionName;
  const db = await getCrawlDataDb();
  const collection = db.collection<Tasks>(collectionName);

  return collection.find(query).toArray();
};

export const findTask = async (query: Filter<Tasks>) => {
  const collectionName = tasksCollectionName;
  const db = await getCrawlDataDb();
  const collection = db.collection<Tasks>(collectionName);

  return collection.findOne(query);
};

export const getTasks = async () => {
  const collectionName = tasksCollectionName;
  const db = await getCrawlDataDb();
  const collection = db.collection(collectionName);
  return collection.find().toArray();
};

export const updateTask = async (
  id: ObjectId,
  updateQuery: UpdateFilter<Tasks>
) => {
  const collectionName = tasksCollectionName;
  const db = await getCrawlDataDb();
  const collection = db.collection(collectionName);
  return collection.updateOne({ _id: id }, updateQuery);
};

export const updateTaskWithQuery = async (
  query: Filter<Tasks>,
  update: UpdateFilter<Tasks>
) => {
  const collectionName = tasksCollectionName;
  const db = await getCrawlDataDb();
  const collection = db.collection<Tasks>(collectionName);
  return collection.updateOne(query, {
    $set: {
      ...update,
    },
  });
};

export const updateTasks = async (
  taskType: TaskTypes,
  update: UpdateFilter<Tasks>
) => {
  const collectionName = tasksCollectionName;
  const db = await getCrawlDataDb();
  const collection = db.collection(collectionName);
  return collection.updateMany(
    { type: taskType },
    {
      $set: {
        ...update,
      },
    }
  );
};

export const addTask = async (task: Tasks, test = false) => {
  let collectionName = test
    ? `test_${tasksCollectionName}`
    : tasksCollectionName;
  const db = await getCrawlDataDb();
  const collection = db.collection(collectionName);
  return collection.insertOne(task);
};

export const deleteTask = async (id: ObjectId) => {
  const collectionName = tasksCollectionName;
  const db = await getCrawlDataDb();
  const collection = db.collection(collectionName);
  return collection.findOneAndDelete({ _id: id });
};

export const deleteTasks = async () => {
  const collectionName = tasksCollectionName;
  const db = await getCrawlDataDb();
  const collection = db.collection(collectionName);
  return collection.deleteMany({});
};

export const deleteTaskwithQuery = async (query: UpdateFilter<Tasks>) => {
  const collectionName = tasksCollectionName;
  const db = await getCrawlDataDb();
  const collection = db.collection(collectionName);
  return collection.findOneAndDelete(query);
};
