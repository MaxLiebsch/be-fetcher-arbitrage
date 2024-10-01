import { ObjectId } from "@dipmaxtech/clr-pkg";
import {
  LockProductTaskTypes,
} from "../../../util/taskTypes.js";
import {
  Options,
  Query,
  lockProductsForCrawlEanQuery,
  setProductsLockedForCrawlEanQuery,
  lockProductsForDealsOnAznQuery,
  setProductsLockedForDealsOnAznQuery,
  lockProductsForNegMarginAznListingsQuery,
  setProductsLockedForNegMarginAznListingsQuery,
  lockProductsForQueryEansOnEbyQuery,
  setProductsLockedForQueryEansOnEbyQuery,
  lockProductsForLookupCategoryQuery,
  setProductsLockedForLookupCategoryQuery,
  lockProductsForLookupInfoQuery,
  setProductsLockedForLookupInfoQuery,
  lockProductsForMatchQuery,
  setProductsLockedForMatchQuery,
} from "../queries.js";
import { Action } from "../../../types/tasks/Tasks.js";

export const lockProductQueries: {
  [key in LockProductTaskTypes]: {
    lock: (
      taskId: ObjectId,
      domain: string,
      limit: number,
      action: Action,
      hasEan?: boolean
    ) => { query: Query; options: Options };
    set: (taskId: ObjectId) => {};
  };
} = {
  CRAWL_EAN: {
    lock: lockProductsForCrawlEanQuery,
    set: setProductsLockedForCrawlEanQuery,
  },
  DEALS_ON_AZN: {
    lock: lockProductsForDealsOnAznQuery,
    set: setProductsLockedForDealsOnAznQuery,
  },
  NEG_AZN_DEALS: {
    lock: lockProductsForNegMarginAznListingsQuery,
    set: setProductsLockedForNegMarginAznListingsQuery,
  },
  QUERY_EANS_EBY: {
    lock: lockProductsForQueryEansOnEbyQuery,
    set: setProductsLockedForQueryEansOnEbyQuery,
  },
  LOOKUP_CATEGORY: {
    lock: lockProductsForLookupCategoryQuery,
    set: setProductsLockedForLookupCategoryQuery,
  },
  LOOKUP_INFO: {
    lock: lockProductsForLookupInfoQuery,
    set: setProductsLockedForLookupInfoQuery,
  },
  MATCH_PRODUCTS: {
    lock: lockProductsForMatchQuery,
    set: setProductsLockedForMatchQuery,
  },
};
