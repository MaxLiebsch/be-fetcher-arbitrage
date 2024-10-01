import { MultiStageTaskTypes, TASK_TYPES } from "../../../util/taskTypes.js";
import {
  getProductsCol,
} from "../../mongo.js";
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
  const productCol = await getProductsCol();
  const query =
    taskType === TASK_TYPES.WHOLESALE_EBY_SEARCH
      ? countCompletedProductsForWholesaleEbySearchQuery(taskId)
      : countCompletedProductsForWholesaleSearchQuery(taskId);

  return productCol.countDocuments(query);
};
export const countPendingProductsForWholesaleSearch = async (
  taskId: ObjectId,
  taskType: MultiStageTaskTypes
) => {
  const productCol = await getProductsCol();
  const query =
    taskType === TASK_TYPES.WHOLESALE_EBY_SEARCH
      ? countPendingProductsForWholesaleEbySearchQuery(taskId)
      : countPendingProductsForWholesaleSearchQuery(taskId);

  return productCol.countDocuments(query);
};

export const countTotalProductsForWholesaleSearch = async (
  taskId: ObjectId
) => {
  const productCol = await getProductsCol();

  return productCol.countDocuments({ taskIds: taskId.toString() });
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
