import { TaskTypes } from '@dipmaxtech/clr-pkg';

type TaskKeys =
  | 'DEALS_ON_EBY'
  | 'DEALS_ON_AZN'
  | 'DAILY_SALES'
  | 'CRAWL_SHOP'
  | 'WHOLESALE_SEARCH'
  | 'WHOLESALE_EBY_SEARCH'
  | 'SCAN_SHOP'
  | 'MATCH_PRODUCTS'
  | 'NEG_AZN_DEALS'
  | 'NEG_EBY_DEALS'
  | 'CRAWL_EAN'
  | 'LOOKUP_INFO'
  | 'QUERY_EANS_EBY'
  | 'LOOKUP_CATEGORY';

export type MultiStageTaskTypes = 'WHOLESALE_EBY_SEARCH' | 'WHOLESALE_SEARCH';

export const TASK_TYPES: { [key in TaskKeys]: TaskTypes } = {
  DEALS_ON_EBY: 'DEALS_ON_EBY',
  DEALS_ON_AZN: 'DEALS_ON_AZN',
  WHOLESALE_EBY_SEARCH: 'WHOLESALE_EBY_SEARCH',
  NEG_AZN_DEALS: 'CRAWL_AZN_LISTINGS',
  NEG_EBY_DEALS: 'CRAWL_EBY_LISTINGS',
  DAILY_SALES: 'DAILY_SALES',
  CRAWL_SHOP: 'CRAWL_SHOP',
  WHOLESALE_SEARCH: 'WHOLESALE_SEARCH',
  SCAN_SHOP: 'SCAN_SHOP',
  MATCH_PRODUCTS: 'MATCH_PRODUCTS',
  CRAWL_EAN: 'CRAWL_EAN',
  LOOKUP_INFO: 'LOOKUP_INFO',
  QUERY_EANS_EBY: 'QUERY_EANS_EBY',
  LOOKUP_CATEGORY: 'LOOKUP_CATEGORY',
};

export type MultiShopTaskTypes =
  | 'DEALS_ON_AZN'
  | 'NEG_AZN_DEALS'
  | 'DEALS_ON_EBY'
  | 'NEG_EBY_DEALS'
  | 'CRAWL_EAN'
  | 'LOOKUP_INFO'
  | 'QUERY_EANS_EBY'
  | 'LOOKUP_CATEGORY';

export type MultiShopTaskTypesWithQuery =
  | 'DEALS_ON_AZN'
  | 'NEG_AZN_DEALS'
  | 'CRAWL_EAN'
  | 'LOOKUP_INFO'
  | 'QUERY_EANS_EBY'
  | 'LOOKUP_CATEGORY';

export type LockProductTaskTypes =
  | MultiShopTaskTypesWithQuery
  | 'MATCH_PRODUCTS';

export const TaskIds: { [key in TaskTypes]: string } = {
  DEALS_ON_AZN: 'dealAznTaskId',
  MATCH_PRODUCTS: 'eby_taskId',
  CRAWL_AZN_LISTINGS: 'azn_taskId',
  CRAWL_EAN: 'ean_taskId',
  LOOKUP_INFO: 'info_taskId',
  QUERY_EANS_EBY: 'eby_taskId',
  LOOKUP_CATEGORY: 'cat_taskId',
  DEALS_ON_EBY: 'dealEbyTaskId',
  CRAWL_EBY_LISTINGS: 'eby_taskId',
  DAILY_SALES: '',
  CRAWL_SHOP: '',
  WHOLESALE_SEARCH: '',
  WHOLESALE_EBY_SEARCH: '',
  SCAN_SHOP: '',
};

export type MultiShopTaskTypesWithAgg = 'DEALS_ON_EBY' | 'NEG_EBY_DEALS';

export const MULTI_SHOP_TASKS: {
  [key in MultiShopTaskTypes]: MultiShopTaskTypes;
} = {
  CRAWL_EAN: 'CRAWL_EAN',
  LOOKUP_INFO: 'LOOKUP_INFO',
  QUERY_EANS_EBY: 'QUERY_EANS_EBY',
  LOOKUP_CATEGORY: 'LOOKUP_CATEGORY',
  DEALS_ON_EBY: 'DEALS_ON_EBY',
  DEALS_ON_AZN: 'DEALS_ON_AZN',
  NEG_AZN_DEALS: 'NEG_AZN_DEALS',
  NEG_EBY_DEALS: 'NEG_EBY_DEALS',
};
