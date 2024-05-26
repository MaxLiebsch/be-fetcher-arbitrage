import { CRAWL_THRESHOLD, MATCH_LOOKUP_THRESHOLD } from "../constants.js";

/*
    #match, lookup, wholsale 
      total / locked products  >= match_lookup_threshold 
    #crawl
      total / estimatedProducts >= crawl_threshold              
*/
export const isTaskComplete = (type, infos, productLimit) => {
  let result = false;
  if (
    type === "MATCH_PRODUCTS" ||
    type === "LOOKUP_PRODUCTS" ||
    type === "WHOLESALE_SEARCH"
  ) {
    result = infos.total / infos.locked >= MATCH_LOOKUP_THRESHOLD;
  } else if (type === "CRAWL_SHOP") {
    result = infos.total / productLimit >= CRAWL_THRESHOLD;
  }
  return result;
};
