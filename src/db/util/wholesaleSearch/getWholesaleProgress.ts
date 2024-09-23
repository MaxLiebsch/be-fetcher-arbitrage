import { MultiStageTaskTypes, TASK_TYPES } from "../../../util/taskTypes.js";
import { getArbispotterDb, wholesaleCollectionName } from "../../mongo.js";
import {
  countCompletedProductsForWholesaleEbySearchQuery,
  countCompletedProductsForWholesaleSearchQuery,
  countPendingProductsForWholesaleEbySearchQuery,
  countPendingProductsForWholesaleSearchQuery,
} from "../queries.js";
import { ObjectId } from "@dipmaxtech/clr-pkg";

export const getCompletedProductsCount = async (
  taskId: ObjectId,
  taskType: MultiStageTaskTypes
) => {
  const db = await getArbispotterDb();
  const wholesaleCollection = db.collection(wholesaleCollectionName);
  const query =
    taskType === TASK_TYPES.WHOLESALE_EBY_SEARCH
      ? countCompletedProductsForWholesaleEbySearchQuery(taskId)
      : countCompletedProductsForWholesaleSearchQuery(taskId);

  return wholesaleCollection.countDocuments(query);
};
export const countPendingProductsForWholesaleSearch = async (
  taskId: ObjectId,
  taskType: MultiStageTaskTypes
) => {
  const db = await getArbispotterDb();
  const wholesaleCollection = db.collection(wholesaleCollectionName);
  const query =
    taskType === TASK_TYPES.WHOLESALE_EBY_SEARCH
      ? countPendingProductsForWholesaleEbySearchQuery(taskId)
      : countPendingProductsForWholesaleSearchQuery(taskId);

  return wholesaleCollection.countDocuments(query);
};

export const countTotalProductsForWholesaleSearch = async (
  taskId: ObjectId
) => {
  const db = await getArbispotterDb();
  const wholesaleCollection = db.collection(wholesaleCollectionName);

  return wholesaleCollection.countDocuments({ taskIds: taskId.toString() });
};

export const getWholesaleSearchProgress = async (
  taskId: ObjectId,
  taskType: MultiStageTaskTypes
) => {
  const pending = await countPendingProductsForWholesaleSearch(
    taskId,
    taskType
  );
  const total = await countTotalProductsForWholesaleSearch(taskId);
  const completed = await getCompletedProductsCount(taskId, taskType);
  return {
    percentage: `${(((total - pending) / total) * 100).toFixed(2)} %`,
    pending,
    completed,
    total,
  };
};
