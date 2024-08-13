import {
  CRAWL_THRESHOLD,
  MATCH_LOOKUP_THRESHOLD,
  SMALL_LOCKED_PRODUCT_CNT_THRESHOLD,
} from "../constants.js";

const isTaskComplete = (type, infos, productLimit) => {
  let taskCompleted = false;
  let completionPercentage = 0;
  const { total, locked } = infos;
  if (
    type === "MATCH_PRODUCTS" ||
    type === "CRAWL_AZN_LISTINGS" ||
    type === "CRAWL_EBY_LISTINGS" ||
    type === "WHOLESALE_SEARCH" ||
    type === "CRAWL_EAN" ||
    type === "LOOKUP_INFO" ||
    type === "QUERY_EANS_EBY" ||
    type === "LOOKUP_CATEGORY"
  ) {
    completionPercentage = total / locked;
    taskCompleted =
      total < SMALL_LOCKED_PRODUCT_CNT_THRESHOLD
        ? true
        : completionPercentage >= MATCH_LOOKUP_THRESHOLD;
  } else if (type === "CRAWL_SHOP" || type === "DAILY_SALES") {
    completionPercentage = total / productLimit;
    taskCompleted = completionPercentage >= CRAWL_THRESHOLD;
  } else if (type === "SCAN_SHOP") {
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
