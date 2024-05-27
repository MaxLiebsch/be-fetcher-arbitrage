import { CRAWL_THRESHOLD, MATCH_LOOKUP_THRESHOLD } from "../constants.js";

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
    taskCompleted = completionPercentage >= MATCH_LOOKUP_THRESHOLD;
  } else if (type === "CRAWL_SHOP") {
    completionPercentage = total / productLimit;
    taskCompleted = completionPercentage >= CRAWL_THRESHOLD;
  }
  return {
    taskCompleted,
    completionPercentage: `${(completionPercentage * 100).toFixed(2)} %`,
  };
};

export default isTaskComplete;
