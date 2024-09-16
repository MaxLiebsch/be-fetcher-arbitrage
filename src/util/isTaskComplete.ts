import { TaskTypes } from "@dipmaxtech/clr-pkg";
import {
  CRAWL_THRESHOLD,
  MATCH_LOOKUP_THRESHOLD,
  SMALL_LOCKED_PRODUCT_CNT_THRESHOLD,
} from "../constants.js";
import { TaskStats } from "../types/taskStats/TasksStats.js";
import { TASK_TYPES } from "./taskTypes.js";

export interface TaskCompletion {
  taskCompleted: boolean;
  completionPercentage: string;
}

const isTaskComplete = (
  type: TaskTypes,
  stats: TaskStats,
  productLimit: number
) => {
  let taskCompleted = false;
  let completionPercentage = 0;
  const { total, locked } = stats;
  if (
    type === TASK_TYPES.MATCH_PRODUCTS ||
    type === TASK_TYPES.NEG_AZN_DEALS ||
    type === TASK_TYPES.NEG_EBY_DEALS ||
    type === TASK_TYPES.DEALS_ON_EBY ||
    type === TASK_TYPES.DEALS_ON_AZN ||
    type === TASK_TYPES.WHOLESALE_SEARCH ||
    type === TASK_TYPES.CRAWL_EAN ||
    type === TASK_TYPES.LOOKUP_INFO ||
    type === TASK_TYPES.QUERY_EANS_EBY ||
    type === TASK_TYPES.LOOKUP_CATEGORY
  ) {
    completionPercentage = total / locked;
    taskCompleted =
      total < SMALL_LOCKED_PRODUCT_CNT_THRESHOLD
        ? true
        : completionPercentage >= MATCH_LOOKUP_THRESHOLD;
  } else if (
    type === TASK_TYPES.CRAWL_SHOP ||
    type === TASK_TYPES.DAILY_SALES
  ) {
    completionPercentage = total / productLimit;
    taskCompleted = completionPercentage >= CRAWL_THRESHOLD;
  } else if (type === TASK_TYPES.SCAN_SHOP) {
    taskCompleted = total > 3;
    if (taskCompleted) {
      completionPercentage = 1;
    }
  }
  return {
    taskCompleted,
    completionPercentage: `${(completionPercentage * 100).toFixed(2)} %`,
  };
};

export default isTaskComplete;
