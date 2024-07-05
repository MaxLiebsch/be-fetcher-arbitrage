import { getCrawlDataDb } from "../../mongo.js";
import {
  countCompletedProductsForWholesaleSearchQuery,
  countPendingProductsForWholesaleSearchQuery,
} from "../queries.js";

const collectionName = "wholesale";

export const getCompletedProductsCount = async (taskId) => {
  const db = await getCrawlDataDb();
  const wholesaleCollection = db.collection(collectionName);
  return wholesaleCollection.count(
    countCompletedProductsForWholesaleSearchQuery(taskId)
  );
};
export const countPendingProductsForWholesaleSearch = async (taskId) => {
  const db = await getCrawlDataDb();
  const wholesaleCollection = db.collection(collectionName);
  return wholesaleCollection.count(
    countPendingProductsForWholesaleSearchQuery(taskId)
  );
};

export const getWholesaleSearchProgress = async (taskId, total) => {
  const pending = await countPendingProductsForWholesaleSearch(taskId);
  const completed = await getCompletedProductsCount(taskId);
  return {
    percentage: `${(((total - pending) / total) * 100).toFixed(2)} %`,
    pending,
    completed,
    total,
  };
};
