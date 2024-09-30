import { ObjectId } from "@dipmaxtech/clr-pkg";
import {
  AggregationReturnTotalProps,
  countPendingProductsForCrawlEanQuery,
  countPendingProductsForNetMarginEbyListingsAgg as countPendingProductsForNegMarginEbyListingsAgg,
  countPendingProductsForDealsOnEbyAgg,
  countPendingProductsForLookupCategoryQuery,
  countPendingProductsLookupInfoQuery,
  countPendingProductsQueryEansOnEbyQuery,
  countTotalProductsDealsOnAznQuery,
  countTotalProductsDealsOnEbyAgg,
  countTotalProductsForCrawlEanQuery,
  countTotalProductsForLookupCategoryQuery,
  countTotalProductsForLookupInfoQuery,
  countTotalProductsForQueryEansOnEbyQuery,
  countTotalProductsNegMarginAznListingsQuery,
  pendingDealsOnAznQuery,
  pendingNegMarginAznListingsQuery,
  countTotalProductsNegMarginEbyListingsAgg,
  setProductsLockedForNegMarginEbyListingsQuery,
  lockProductsForNegMarginEbyListings,
  setProductsLockedForDealsOnEbyQuery,
  lockProductsForDealsOnEbyAgg,
  countPendingProductsForMatchQuery,
  countTotalProductsForMatchQuery,
} from "../queries.js";
import { Action } from "../../../types/tasks/Tasks.js";
import {
  LockProductTaskTypes,
  MultiShopTaskTypesWithAgg,
} from "../../../util/taskTypes.js";

export const progressQueries: {
  [key in LockProductTaskTypes]: {
    pending: (domain: string, hasEan?: boolean) => {};
    total: (domain: string, hasEan?: boolean) => {};
  };
} = {
  DEALS_ON_AZN: {
    pending: pendingDealsOnAznQuery,
    total: countTotalProductsDealsOnAznQuery,
  },
  NEG_AZN_DEALS: {
    pending: pendingNegMarginAznListingsQuery,
    total: countTotalProductsNegMarginAznListingsQuery,
  },
  QUERY_EANS_EBY: {
    pending: countPendingProductsQueryEansOnEbyQuery,
    total: countTotalProductsForQueryEansOnEbyQuery,
  },
  LOOKUP_CATEGORY: {
    pending: countPendingProductsForLookupCategoryQuery,
    total: countTotalProductsForLookupCategoryQuery,
  },
  CRAWL_EAN: {
    pending: countPendingProductsForCrawlEanQuery,
    total: countTotalProductsForCrawlEanQuery,
  },
  LOOKUP_INFO: {
    pending: countPendingProductsLookupInfoQuery,
    total: countTotalProductsForLookupInfoQuery,
  },
  MATCH_PRODUCTS: {
    pending: countPendingProductsForMatchQuery,
    total: countTotalProductsForMatchQuery,
  },
};

export const progressAggs: {
  [key in MultiShopTaskTypesWithAgg]: {
    pending: (args: AggregationReturnTotalProps) => any[];
    set: (taskId: ObjectId) => {};
    lock: (
      taskId: ObjectId,
      domain: string,
      limit: number,
      action: Action,
      hasEan?: boolean
    ) => any[];
    total: (domain: string) => any[];
  };
} = {
  NEG_EBY_DEALS: {
    pending: countPendingProductsForNegMarginEbyListingsAgg,
    set: setProductsLockedForNegMarginEbyListingsQuery,
    lock: lockProductsForNegMarginEbyListings,
    total: countTotalProductsNegMarginEbyListingsAgg,
  },
  DEALS_ON_EBY: {
    pending: countPendingProductsForDealsOnEbyAgg,
    lock: lockProductsForDealsOnEbyAgg,
    set: setProductsLockedForDealsOnEbyQuery,
    total: countTotalProductsDealsOnEbyAgg,
  },
};
