import { getCrawlDataDb, hostname, tasksCollectionName } from "../mongo.js";
import { countPendingProductsForCrawlAznListings } from "../util/crawlAznListings/getCrawlAznListingsProgress.js";
import { countPendingProductsForMatch } from "../util/match/getMatchProgress.js";
import { COOLDOWN, COOLDOWN_LONG } from "../../../constants.js";
import { findTasksQuery } from "./queries.js";
import { getMissingEanShops } from "../util/crawlEan/getMissingEanShops.js";
import { getUnmatchedQueryEansOnEbyShops } from "../util/queryEansOnEby/getUnmatchedQueryEansOnEbyShops.js";
import { getUnmatchedEanShops } from "../util/lookupInfo/getUnmatchedEanShops.js";
import { getMissingEbyCategoryShops } from "./lookupCategory/getMissingEbyCategoryShops.js";
import { countPendingProductsForWholesaleSearch } from "./wholesaleSearch/getWholesaleProgress.js";
import { MINIMUM_PENDING_PRODUCTS } from "@dipmaxtech/clr-pkg";
import { UTCDate } from "@date-fns/utc";
import { countPendingProductsForCrawlEbyListingsAggregationFn } from "./crawlEbyListings/getCrawlEbyListingsProgressAggregation.js";
import { getOutdatedDealsOnEbyShops } from "./deals/eby/getOutdatedDealsOnEbyShops.js";
import { getOutdatedDealsOnAznShops } from "./deals/azn/getOutdatedDealsOnAznShops.js";

const handleComulativTasks = async (task, pendingShops, cooldown) => {
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

const handleSingleTask = async (task, pending, cooldown) => {
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

export const getNewTask = async () => {
  const { prioQuery, query, fallbackQuery, update } = findTasksQuery();
  const collectionName = tasksCollectionName;
  const db = await getCrawlDataDb();
  const taskCollection = db.collection(collectionName);
  const coolDownFactor = process.env.DEBUG ? 1000 * 60 * 2 : COOLDOWN;
  const cooldown = new Date(Date.now() + coolDownFactor).toISOString(); // 30 min in future

  const prioTask = await taskCollection.findOneAndUpdate(prioQuery, update, {
    returnNewDocument: true,
  });

  if (prioTask) {
    console.log("Prio:task:", prioTask?.type, " ", prioTask?.id);
    if (prioTask.type === "DEALS_ON_EBY") {
      const pendingShops = await getOutdatedDealsOnEbyShops();
      console.log("DEALS_ON_EBY: pendingShops:", pendingShops.length);
      return await handleComulativTasks(prioTask, pendingShops, cooldown);
    }
    if (prioTask.type === "DEALS_ON_AZN") {
      const pendingShops = await getOutdatedDealsOnAznShops();
      console.log("DEALS_ON_AZN: pendingShops:", pendingShops.length);
      return await handleComulativTasks(prioTask, pendingShops, cooldown);
    }
    return prioTask;
  }

  const task = await taskCollection.findOneAndUpdate(query, update, {
    returnNewDocument: true,
  });
  console.log("Primary:task:", task?.type, " ", task?.id);
  if (task) {
    if (task.type === "SCAN_SHOP") {
      return task;
    }
    if (task.type === "WHOLESALE_SEARCH") {
      const pending = await countPendingProductsForWholesaleSearch(task._id);
      console.log("WHOLESALE_SEARCH: pending:", pending);
      return await handleSingleTask(task, pending, cooldown);
    }
    if (task.type === "CRAWL_EAN") {
      const pendingShops = await getMissingEanShops(task.proxyType);
      console.log("CRAWL_EAN: pendingShops:", pendingShops.length);
      return await handleComulativTasks(task, pendingShops, cooldown);
    }
    if (task.type === "LOOKUP_INFO") {
      const pendingShops = await getUnmatchedEanShops();
      console.log("LOOKUP_INFO: pendingShops:", pendingShops.length);
      return await handleComulativTasks(task, pendingShops, cooldown);
    }
    if (task.type === "QUERY_EANS_EBY") {
      const pendingShops = await getUnmatchedQueryEansOnEbyShops();
      console.log("QUERY_EANS_EBY: pendingShops:", pendingShops.length);
      return await handleComulativTasks(task, pendingShops, cooldown);
    }
    if (task.type === "MATCH_PRODUCTS") {
      const shopProductCollectionName = task.shopDomain;
      const pending = await countPendingProductsForMatch(
        shopProductCollectionName,
        false
      );
      console.log("MATCH_PRODUCTS: pending:", pending);
      return await handleSingleTask(task, pending, cooldown);
    }
    if (task.type === "CRAWL_AZN_LISTINGS") {
      const shopProductCollectionName = task.shopDomain;
      const pending = await countPendingProductsForCrawlAznListings(
        shopProductCollectionName
      );
      console.log("CRAWL_AZN_LISTINGS: pending:", pending);
      if (pending < task.minPendingProducts) {
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
    }
    if (task.type === "CRAWL_EBY_LISTINGS") {
      const shopProductCollectionName = task.shopDomain;
      const [pending] =
        await countPendingProductsForCrawlEbyListingsAggregationFn(
          shopProductCollectionName
        );
      console.log("CRAWL_EBY_LISTINGS: pending:", pending.total);
      if (pending.total < task.minPendingProducts) {
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
    }
    if (task.type === "LOOKUP_CATEGORY") {
      const pendingShops = await getMissingEbyCategoryShops();
      console.log("LOOKUP_CATEGORY: pendingShops:", pendingShops.length);
      return await handleComulativTasks(task, pendingShops, cooldown);
    }
  
  } else {
    //fallback
    const task = await taskCollection.findOneAndUpdate(fallbackQuery, update, {
      returnNewDocument: true,
    });
    console.log("Fallback:task:", task?.type, " ", task?.id);
    const coolDownFactor = process.env.DEBUG ? 1000 * 60 * 2 : COOLDOWN_LONG; // 60 min in future
    const cooldown = new UTCDate(Date.now() + coolDownFactor).toISOString();
    if (task) {
      if (task.type === "WHOLESALE_SEARCH") {
        const pending = await countPendingProductsForWholesaleSearch(task._id);
        console.log("WHOLESALE_SEARCH: pending:", pending);
        return await handleSingleTask(task, pending, cooldown);
      }
      if (task.type === "MATCH_PRODUCTS") {
        const shopProductCollectionName = task.shopDomain;
        const pending = await countPendingProductsForMatch(
          shopProductCollectionName,
          false
        );
        console.log("MATCH_PRODUCTS: pending:", pending);
        return await handleSingleTask(task, pending, cooldown);
      }
      if (task.type === "QUERY_EANS_EBY") {
        const pendingShops = await getUnmatchedQueryEansOnEbyShops();
        console.log("QUERY_EANS_EBY: pendingShops:", pendingShops.length);
        return await handleComulativTasks(task, pendingShops, cooldown);
      }
      if (task.type === "CRAWL_EAN") {
        const pendingShops = await getMissingEanShops(task.proxyType);
        console.log("CRAWL_EAN: pendingShops:", pendingShops.length);
        return await handleComulativTasks(task, pendingShops, cooldown);
      }
      if (task.type === "CRAWL_AZN_LISTINGS") {
        const shopColName = task.shopDomain;
        const pending = await countPendingProductsForCrawlAznListings(
          shopColName
        );
        console.log("CRAWL_AZN_LISTINGS: pending:", pending);
        if (pending < task.minPendingProducts) {
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
      }
      if (task.type === "CRAWL_EBY_LISTINGS") {
        const shopColName = task.shopDomain;
        const [pending] =
          await countPendingProductsForCrawlEbyListingsAggregationFn(
            shopColName
          );
        console.log("CRAWL_EBY_LISTINGS: pending:", pending.total);
        if (pending.total < task.minPendingProducts) {
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
      }
      if (task.type === "CRAWL_EAN") {
        const pendingShops = await getMissingEanShops(task.proxyType);
        console.log("CRAWL_EAN: pendingShops:", pendingShops.length);
        return await handleComulativTasks(task, pendingShops, cooldown);
      }
      if (task.type === "LOOKUP_INFO") {
        const pendingShops = await getUnmatchedEanShops();
        console.log("LOOKUP_INFO: pendingShops:", pendingShops.length);
        return await handleComulativTasks(task, pendingShops, cooldown);
      }
      if (task.type === "LOOKUP_CATEGORY") {
        const pendingShops = await getMissingEbyCategoryShops();
        console.log("LOOKUP_CATEGORY: pendingShops:", pendingShops.length);
        return await handleComulativTasks(task, pendingShops, cooldown);
      }
    }
    return null;
  }
};

export const findTasks = async (query, test = false) => {
  const collectionName = test
    ? `test_${tasksCollectionName}`
    : tasksCollectionName;
  const db = await getCrawlDataDb();
  const collection = db.collection(collectionName);

  return collection.find(query).toArray();
};

export const findTask = async (query) => {
  const collectionName = tasksCollectionName;
  const db = await getCrawlDataDb();
  const collection = db.collection(collectionName);

  return collection.findOne(query);
};

export const getTasks = async () => {
  const collectionName = tasksCollectionName;
  const db = await getCrawlDataDb();
  const collection = db.collection(collectionName);
  return collection.find().toArray();
};

export const updateTask = async (id, updateQuery) => {
  const collectionName = tasksCollectionName;
  const db = await getCrawlDataDb();
  const collection = db.collection(collectionName);
  return collection.updateOne({ _id: id }, updateQuery);
};

export const updateTaskWithQuery = async (query, update) => {
  const collectionName = tasksCollectionName;
  const db = await getCrawlDataDb();
  const collection = db.collection(collectionName);
  return collection.updateOne(query, {
    $set: {
      ...update,
    },
  });
};

export const updateTasks = async (taskType, update) => {
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

export const addTask = async (task, test = false) => {
  let collectionName = test
    ? `test_${tasksCollectionName}`
    : tasksCollectionName;
  const db = await getCrawlDataDb();
  const collection = db.collection(collectionName);
  return collection.insertOne(task);
};

export const deleteTask = async (id) => {
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

export const deleteTaskwithQuery = async (query) => {
  const collectionName = tasksCollectionName;
  const db = await getCrawlDataDb();
  const collection = db.collection(collectionName);
  return collection.findOneAndDelete(query);
};
