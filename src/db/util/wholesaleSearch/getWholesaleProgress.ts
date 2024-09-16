import { getArbispotterDb, wholesaleCollectionName } from "../../mongo.js";
import {
  countCompletedProductsForWholesaleSearchQuery,
  countPendingProductsForWholesaleSearchQuery,
} from "../queries.js";
import { ObjectId } from "@dipmaxtech/clr-pkg";

export const getCompletedProductsCount = async (taskId: ObjectId) => {
  const db = await getArbispotterDb();
  const wholesaleCollection = db.collection(wholesaleCollectionName);
  return wholesaleCollection.countDocuments(
    countCompletedProductsForWholesaleSearchQuery(taskId)
  );
};
export const countPendingProductsForWholesaleSearch = async (
  taskId: ObjectId
) => {
  const db = await getArbispotterDb();
  const wholesaleCollection = db.collection(wholesaleCollectionName);
  return wholesaleCollection.countDocuments(
    countPendingProductsForWholesaleSearchQuery(taskId)
  );
};

export const countTotalProductsForWholesaleSearch = async (
  taskId: ObjectId
) => {
  const db = await getArbispotterDb();
  const wholesaleCollection = db.collection(wholesaleCollectionName);
  return wholesaleCollection.countDocuments({ taskId: taskId.toString() });
};

export const getWholesaleSearchProgress = async (taskId: ObjectId) => {
  const pending = await countPendingProductsForWholesaleSearch(taskId);
  const total = await countTotalProductsForWholesaleSearch(taskId);
  const completed = await getCompletedProductsCount(taskId);
  return {
    percentage: `${(((total - pending) / total) * 100).toFixed(2)} %`,
    pending,
    completed,
    total,
  };
};
