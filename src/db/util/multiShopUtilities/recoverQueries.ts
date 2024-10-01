import { ObjectId } from "@dipmaxtech/clr-pkg";
import { MultiShopTaskTypes } from "../../../util/taskTypes.js";
import {
  recoveryNegMarginAznListingsQuery,
  recoveryCrawlEanQuery,
  recoveryDealsOnAznQuery,
  recoveryDealsOnEbyQuery,
  recoveryLookupCategoryQuery,
  recoveryLookupInfoQuery,
  recoveryQueryEansOnEby,
} from "../queries.js";

export const recoverQueries: {
  [key in MultiShopTaskTypes]: (taskid: ObjectId, shopDomain: string) => {};
} = {
  DEALS_ON_EBY: recoveryDealsOnEbyQuery,
  DEALS_ON_AZN: recoveryDealsOnAznQuery,
  NEG_AZN_DEALS: recoveryNegMarginAznListingsQuery,
  NEG_EBY_DEALS: recoveryCrawlEanQuery,
  CRAWL_EAN: recoveryCrawlEanQuery,
  LOOKUP_INFO: recoveryLookupInfoQuery,
  QUERY_EANS_EBY: recoveryQueryEansOnEby,
  LOOKUP_CATEGORY: recoveryLookupCategoryQuery,
};
