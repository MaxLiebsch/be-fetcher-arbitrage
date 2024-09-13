import { TaskTypes } from "@dipmaxtech/clr-pkg";
import { TASK_TYPES } from "./taskTypes";

export const getTaskSymbol = (type: TaskTypes) => {
  switch (type) {
    case TASK_TYPES.DAILY_SALES:
      return "🚀";
    case TASK_TYPES.CRAWL_SHOP:
      return "🕷️";
    case TASK_TYPES.WHOLESALE_SEARCH:
      return "🔍";
    case TASK_TYPES.SCAN_SHOP:
      return "🔎";
    case TASK_TYPES.MATCH_PRODUCTS:
      return "🧩";
    case TASK_TYPES.NEG_AZN_DEALS:
      return "🔍";
    case TASK_TYPES.NEG_EBY_DEALS:
      return "🔍";
    case TASK_TYPES.QUERY_EANS_EBY:
      return "🔍";
    case TASK_TYPES.LOOKUP_CATEGORY:
      return "🔍";
    case TASK_TYPES.LOOKUP_INFO:
      return "🔍";
    case TASK_TYPES.CRAWL_EAN:
      return "🆕";
    case TASK_TYPES.DEALS_ON_EBY:
      return "🔍";
    case TASK_TYPES.DEALS_ON_AZN:
      return "🔍";
    default:
      return "🤷‍♂️";
  }
};
