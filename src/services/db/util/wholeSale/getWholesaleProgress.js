import { getCrawlDataDb } from "../../mongo.js";

const collectionName = "wholesale";

export const getCompletedProductsCount = async (taskId) => {
  const db = await getCrawlDataDb();
  const wholesaleCollection = db.collection(collectionName);
  return wholesaleCollection.count({
    taskId: taskId.toString(),
    status: { $exists: true },
    $or: [
      {
        status: {
          $eq: "complete",
        },
      },
      {
        status: {
          $eq: "not found",
        },
      },
    ],
  });
};

export const getProductsToLookupCount = async (taskId) => {
  const db = await getCrawlDataDb();
  const wholesaleCollection = db.collection(collectionName);
  return wholesaleCollection.count({
    taskId: taskId.toString(),
    lookup_pending: true,
    locked: false,
  });
};

export const getWholesaleProgress = async (taskId, total) => {
  const pending = await getProductsToLookupCount(taskId);
  console.log('pending:', pending)
  const completed = await getCompletedProductsCount(taskId);
  return {
    percentage: `${(((total - pending) / total) * 100).toFixed(2)} %`,
    pending,
    completed,
    total,
  };
};
