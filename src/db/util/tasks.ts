import { getCrawlDataDb, hostname, tasksCollectionName } from "../mongo.js";
import {
  MINIMUM_PENDING_PRODUCTS,
  ObjectId,
  TaskTypes,
} from "@dipmaxtech/clr-pkg";

import {  Tasks } from "../../types/tasks/Tasks.js";
import { PendingShops } from "../../types/shops.js";
import { Filter, UpdateFilter } from "mongodb";


export const handleComulativTasks = async (
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

export const handleSingleTask = async (
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

export const addTask = async (task: any, test = false) => {
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

export const insertTasks = async (tasks: Tasks[]) => {
  const collectionName = tasksCollectionName;
  const db = await getCrawlDataDb();
  const collection = db.collection(collectionName);
  return collection.insertMany(tasks);
}

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
