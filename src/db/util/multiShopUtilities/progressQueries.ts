import {
    MultiShopTaskProgressQueries,
  MultiShopTaskProgressQueriesAgg,
  MultiShopTaskTypes,
  MultiStageTaskTypes,
} from "../../../util/taskTypes.js";
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
} from "../queries.js";

export const progressQueries: {
  [key in MultiShopTaskProgressQueries
  ]: {
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
};

export const progressAggs:{
    [key in MultiShopTaskProgressQueriesAgg
    ]: {
      pending: (args: AggregationReturnTotalProps) => any[];
      total: (domain: string) => any[];
    };
  } = {
  NEG_EBY_DEALS: {
    pending: countPendingProductsForNegMarginEbyListingsAgg,
    total: countTotalProductsNegMarginEbyListingsAgg,
  },
  DEALS_ON_EBY: {
    pending: countPendingProductsForDealsOnEbyAgg,
    total: countTotalProductsDealsOnEbyAgg,
  }
};
