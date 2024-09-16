import { getCrawlDataDb, hostname, tasksCollectionName } from "../mongo";
import { countPendingProductsForMatch } from "./match/getMatchProgress";
import { findTasksQuery } from "./queries";
import { getMissingEanShops } from "./crawlEan/getMissingEanShops";
import { getUnmatchedQueryEansOnEbyShops } from "./queryEansOnEby/getUnmatchedQueryEansOnEbyShops";
import { getUnmatchedEanShops } from "./lookupInfo/getUnmatchedEanShops";
import { getMissingEbyCategoryShops } from "./lookupCategory/getMissingEbyCategoryShops";
import { countPendingProductsForWholesaleSearch } from "./wholesaleSearch/getWholesaleProgress";
import {
  MINIMUM_PENDING_PRODUCTS,
  ObjectId,
  TaskTypes,
} from "@dipmaxtech/clr-pkg";
import { UTCDate } from "@date-fns/utc";
import { getOutdatedDealsOnAznShops } from "./deals/daily/azn/getOutdatedDealsOnAznShops";
import { getOutdatedNegMarginEbyListingsPerShop } from "./deals/weekly/eby/getOutdatedNegMarginEbyListingsPerShop";
import { getOutdatedNegMarginAznListingsPerShop } from "./deals/weekly/azn/getOutdatedNegMarginAznListingsPerShop";
import { getOutdatedDealsOnEbyShops } from "./deals/daily/eby/getOutdatedDealsOnEbyShops";
import { TASK_TYPES } from "../../util/taskTypes";
import { MatchProductsTask, Tasks } from "../../types/tasks/Tasks";
import { PendingShops } from "../../types/shops";
import { COOLDOWN, COOLDOWN_LONG } from "../../constants";
import { Filter, UpdateFilter } from "mongodb";

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
  console.log("Prio:task:", prioTask?.type, " ", prioTask?.id);
  if (prioTask) {
    if (prioTask.type === TASK_TYPES.DEALS_ON_EBY && "proxyType" in prioTask) {
      const { pendingShops, shops } = await getOutdatedDealsOnEbyShops(
        prioTask.proxyType
      );
      console.log("DEALS_ON_EBY: pendingShops:", pendingShops.length);
      return await handleComulativTasks(prioTask, pendingShops, cooldown);
    }
    if (prioTask.type === TASK_TYPES.DEALS_ON_AZN && "proxyType" in prioTask) {
      const { pendingShops, shops } = await getOutdatedDealsOnAznShops(
        prioTask.proxyType
      );
      console.log("DEALS_ON_AZN: pendingShops:", pendingShops.length);
      return await handleComulativTasks(prioTask, pendingShops, cooldown);
    }
    return prioTask;
  }

  const task = await taskCollection.findOneAndUpdate(query, update, {
    returnDocument: "after",
  });
  console.log("Primary:task:", task?.type, " ", task?.id);
  if (task) {
    if (task.type === TASK_TYPES.SCAN_SHOP) {
      return task;
    }
    if (task.type === TASK_TYPES.WHOLESALE_SEARCH) {
      const pending = await countPendingProductsForWholesaleSearch(task._id);
      console.log("WHOLESALE_SEARCH: pending:", pending);
      return await handleSingleTask(task, pending, cooldown);
    }
    if (task.type === TASK_TYPES.CRAWL_EAN && "proxyType" in task) {
      const { pendingShops, shops } = await getMissingEanShops(task.proxyType);
      console.log("CRAWL_EAN: pendingShops:", pendingShops.length);
      return await handleComulativTasks(task, pendingShops, cooldown);
    }
    if (task.type === TASK_TYPES.LOOKUP_INFO) {
      const { pendingShops, shops } = await getUnmatchedEanShops();
      console.log("LOOKUP_INFO: pendingShops:", pendingShops.length);
      return await handleComulativTasks(task, pendingShops, cooldown);
    }
    if (task.type === TASK_TYPES.QUERY_EANS_EBY) {
      const { pendingShops, shops } = await getUnmatchedQueryEansOnEbyShops();
      console.log("QUERY_EANS_EBY: pendingShops:", pendingShops.length);
      return await handleComulativTasks(task, pendingShops, cooldown);
    }
    if (task.type === TASK_TYPES.MATCH_PRODUCTS) {
      const shopProductCollectionName = (task as MatchProductsTask).shopDomain;
      const pending = await countPendingProductsForMatch(
        shopProductCollectionName,
        false
      );
      console.log("MATCH_PRODUCTS: pending:", pending);
      return await handleSingleTask(task, pending, cooldown);
    }
    if (task.type === TASK_TYPES.NEG_AZN_DEALS && "proxyType" in task) {
      const { pendingShops, shops } =
        await getOutdatedNegMarginAznListingsPerShop(task.proxyType);
      console.log("NEG_AZN_DEALS: pendingShops:", pendingShops.length);
      return await handleComulativTasks(task, pendingShops, cooldown);
    }
    if (task.type === TASK_TYPES.NEG_EBY_DEALS && "proxyType" in task) {
      const { pendingShops, shops } =
        await getOutdatedNegMarginEbyListingsPerShop(task.proxyType);
      console.log("NEG_EBY_DEALS: pendingShops:", pendingShops.length);
      return await handleComulativTasks(task, pendingShops, cooldown);
    }
    if (task.type === TASK_TYPES.LOOKUP_CATEGORY && "proxyType" in task) {
      const { pendingShops, shops } = await getMissingEbyCategoryShops();
      console.log("LOOKUP_CATEGORY: pendingShops:", pendingShops.length);
      return await handleComulativTasks(task, pendingShops, cooldown);
    }
  } else {
    //fallback
    const task = await taskCollection.findOneAndUpdate(fallbackQuery, update, {
      returnDocument: "after",
    });
    console.log("Fallback:task:", task?.type, " ", task?.id);
    const coolDownFactor = process.env.DEBUG ? 1000 * 60 * 2 : COOLDOWN_LONG; // 60 min in future
    const cooldown = new UTCDate(Date.now() + coolDownFactor).toISOString();
    if (task) {
      if (task.type === TASK_TYPES.WHOLESALE_SEARCH) {
        const pending = await countPendingProductsForWholesaleSearch(task._id);
        console.log("WHOLESALE_SEARCH: pending:", pending);
        return await handleSingleTask(task, pending, cooldown);
      }
      if (task.type === TASK_TYPES.MATCH_PRODUCTS) {
        const shopProductCollectionName = (task as MatchProductsTask)
          .shopDomain;
        const pending = await countPendingProductsForMatch(
          shopProductCollectionName,
          false
        );
        console.log("MATCH_PRODUCTS: pending:", pending);
        return await handleSingleTask(task, pending, cooldown);
      }
      if (task.type === TASK_TYPES.QUERY_EANS_EBY) {
        const { pendingShops, shops } = await getUnmatchedQueryEansOnEbyShops();
        console.log("QUERY_EANS_EBY: pendingShops:", pendingShops.length);
        return await handleComulativTasks(task, pendingShops, cooldown);
      }
      if (task.type === TASK_TYPES.CRAWL_EAN && "proxyType" in task) {
        const { pendingShops, shops } = await getMissingEanShops(
          task.proxyType
        );
        console.log("CRAWL_EAN: pendingShops:", pendingShops.length);
        return await handleComulativTasks(task, pendingShops, cooldown);
      }
      if (task.type === TASK_TYPES.NEG_AZN_DEALS && "proxyType" in task) {
        const { pendingShops, shops } =
          await getOutdatedNegMarginAznListingsPerShop(task.proxyType);
        console.log("NEG_AZN_DEALS: pendingShops:", pendingShops.length);
        return await handleComulativTasks(task, pendingShops, cooldown);
      }
      if (task.type === TASK_TYPES.NEG_EBY_DEALS && "proxyType" in task) {
        const { pendingShops, shops } =
          await getOutdatedNegMarginEbyListingsPerShop(task.proxyType);
        console.log("NEG_EBY_DEALS: pendingShops:", pendingShops.length);
        return await handleComulativTasks(task, pendingShops, cooldown);
      }
      if (task.type === TASK_TYPES.CRAWL_EAN && "proxyType" in task) {
        const { pendingShops, shops } = await getMissingEanShops(
          task.proxyType
        );
        console.log("CRAWL_EAN: pendingShops:", pendingShops.length);
        return await handleComulativTasks(task, pendingShops, cooldown);
      }
      if (task.type === TASK_TYPES.LOOKUP_INFO) {
        const { pendingShops, shops } = await getUnmatchedEanShops();
        console.log("LOOKUP_INFO: pendingShops:", pendingShops.length);
        return await handleComulativTasks(task, pendingShops, cooldown);
      }
      if (task.type === TASK_TYPES.LOOKUP_CATEGORY) {
        const { pendingShops, shops } = await getMissingEbyCategoryShops();
        console.log("LOOKUP_CATEGORY: pendingShops:", pendingShops.length);
        return await handleComulativTasks(task, pendingShops, cooldown);
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
