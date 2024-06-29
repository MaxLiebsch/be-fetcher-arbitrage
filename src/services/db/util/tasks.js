import { getCrawlDataDb, hostname, tasksCollectionName } from "../mongo.js";
import { countPendingProductsForCrawlAznListings } from "./getCrawlAznListingsProgress.js";
import { countPendingProductsForMatch } from "./getMatchProgress.js";
import { COOLDOWN_LONG } from "../../../constants.js";
import { findTasksQuery } from "./queries.js";
import { findMissingEanShops } from "./lookForMissingEans.js";
import { getUnmatchecEanShops } from "./lookForUnmatchedEans.js";

export const getNewTask = async () => {
  const collectionName = tasksCollectionName;
  const db = await getCrawlDataDb();
  const taskCollection = db.collection(collectionName);
  const {
    query,
    update,
    lookupInfoTaskQuery,
    matchTaskQuery,
    danglingLookupThreshold,
    crawlAznListingsTaskQuery,
    crawlEanTaskQuery,
  } = findTasksQuery();
  const task = await taskCollection.findOneAndUpdate(query, update, {
    returnNewDocument: true,
  });
  console.log("Primary:task:", task?.type, " ", task?.id);

  if (task) {
    if (
      task.type === "CRAWL_SHOP" ||
      task.type === "WHOLESALE_SEARCH" ||
      task.type === "SCAN_SHOP"
    ) {
      return task;
    }
    if (task.type === "CRAWL_EAN") {
      const pendingShops = await findMissingEanShops(task.proxyType);
      if (pendingShops.length === 0) {
        await updateTask(task._id, {
          $set: {
            executing: false,
            cooldown: new Date(Date.now() + COOLDOWN_LONG).toISOString(),
          },
          $pull: { lastCrawler: hostname },
        });
        return null;
      } else {
        return task;
      }
    }
    if (task.type === "LOOKUP_INFO") {
      const pendingShops = await getUnmatchecEanShops();
      if (pendingShops.length === 0) {
        await updateTask(task._id, {
          $set: {
            executing: false,
            cooldown: new Date(Date.now() + COOLDOWN_LONG).toISOString(),
          },
          $pull: { lastCrawler: hostname },
        });
        return null;
      } else {
        return task;
      }
    }
    if (task.type === "MATCH_PRODUCTS") {
      const shopProductCollectionName = task.shopDomain;
      const pending = await countPendingProductsForMatch(
        shopProductCollectionName
      );
      if (pending === 0) {
        await updateTask(task._id, {
          $set: {
            executing: false,
            cooldown: new Date(Date.now() + COOLDOWN_LONG).toISOString(),
          },
          $pull: { lastCrawler: hostname },
        });
        return null;
      } else {
        return task;
      }
    }
    if (task.type === "CRAWL_AZN_LISTINGS") {
      const shopProductCollectionName = task.shopDomain;
      const pending = await countPendingProductsForCrawlAznListings(
        shopProductCollectionName
      );
      if (pending < danglingLookupThreshold) {
        await updateTask(task._id, {
          $set: {
            executing: false,
            cooldown: new Date(Date.now() + COOLDOWN_LONG).toISOString(),
          },
          $pull: { lastCrawler: hostname },
        });
        return null;
      } else {
        return task;
      }
    }
  } else {
    //fallback
    const query = {
      $and: [
        {
          maintenance: false,
        },
        {
          $or: [
            {
              $and: matchTaskQuery,
            },
            {
              $and: crawlAznListingsTaskQuery,
            },
            { $and: crawlEanTaskQuery },
            { $and: lookupInfoTaskQuery },
          ],
        },
      ],
    };

    const task = await taskCollection.findOneAndUpdate(query, update, {
      returnNewDocument: true,
    });
    console.log("Fallback:task:", task?.type, " ", task?.id);
    if (task) {
      if (task.type === "MATCH_PRODUCTS") {
        const shopProductCollectionName = task.shopDomain  ;
        const pending = await countPendingProductsForMatch(
          shopProductCollectionName
        );
        if (pending === 0) {
          await updateTask(task._id, {
            $set: {
              executing: false,
              cooldown: new Date(Date.now() + +COOLDOWN_LONG).toISOString(),
            },
            $pull: { lastCrawler: hostname },
          });
          return null;
        } else {
          return task;
        }
      }
      if (task.type === "CRAWL_AZN_LISTINGS") {
        const shopProductCollectionName = task.shopDomain;
        const pending = await countPendingProductsForCrawlAznListings(
          shopProductCollectionName
        );
        if (pending < danglingLookupThreshold
        ) {
          await updateTask(task._id, {
            $set: {
              executing: false,
              cooldown: new Date(Date.now() + COOLDOWN_LONG).toISOString(),
            },
            $pull: { lastCrawler: hostname },
          });
          return null;
        } else {
          return task;
        }
      }
      if (task.type === "CRAWL_EAN") {
        const pendingShops = await findMissingEanShops(task.proxyType);
        if (pendingShops.length === 0) {
          await updateTask(task._id, {
            $set: {
              executing: false,
              cooldown: new Date(Date.now() + COOLDOWN_LONG).toISOString(),
            },
            $pull: { lastCrawler: hostname },
          });
          return null;
        } else {
          return task;
        }
      }
      if (task.type === "LOOKUP_INFO") {
        const pendingShops = await getUnmatchecEanShops();
        if (pendingShops.length === 0) {
          await updateTask(task._id, {
            $set: {
              executing: false,
              cooldown: new Date(Date.now() + COOLDOWN_LONG).toISOString(),
            },
            $pull: { lastCrawler: hostname },
          });
          return null;
        } else {
          return task;
        }
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

export const addTask = async (task) => {
  const collectionName = tasksCollectionName;
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
