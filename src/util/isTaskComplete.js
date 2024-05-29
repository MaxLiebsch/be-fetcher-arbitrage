import {
  CRAWL_THRESHOLD,
  MATCH_LOOKUP_THRESHOLD,
  SMALL_LOCKED_PRODUCT_CNT_THRESHOLD,
} from "../constants.js";

/*
    #match, lookup, wholsale 
      total / locked products  >= match_lookup_threshold 
    #crawl
      total / estimatedProducts >= crawl_threshold              
*/
const isTaskComplete = (type, infos, productLimit) => {
  let taskCompleted = false;
  let completionPercentage = 0;
  const { total, locked } = infos;
  if (
    type === "MATCH_PRODUCTS" ||
    type === "LOOKUP_PRODUCTS" ||
    type === "WHOLESALE_SEARCH"
  ) {
    completionPercentage = total / locked;
    taskCompleted =
      total < SMALL_LOCKED_PRODUCT_CNT_THRESHOLD
        ? true
        : completionPercentage >= MATCH_LOOKUP_THRESHOLD;
  } else if (type === "CRAWL_SHOP") {
    completionPercentage = total / productLimit;
    taskCompleted = completionPercentage >= CRAWL_THRESHOLD;
  } else if (type === "SCAN_SHOP") {
    taskCompleted = total > 3;
    if(taskCompleted) {
      completionPercentage = 1;
    }
  }
  return {
    taskCompleted,
    completionPercentage: `${(completionPercentage * 100).toFixed(2)} %`,
  };
};

export default isTaskComplete;
