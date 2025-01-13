import { startOfDay, subWeeks } from 'date-fns';
import { hostname, wholeSaleColname } from '../mongo.js';

import { TASK_TYPES } from '../../util/taskTypes.js';
import { ObjectId } from 'mongodb';
import { Action } from '../../types/tasks/Tasks.js';
import { subDateDaysISO } from '../../util/dates.js';
import {
  DANGLING_LOOKUP_THRESHOLD,
  DANGLING_MATCH_THRESHOLD,
  DEALS_ON_AZN_DAYS,
  DEALS_ON_EBY_DAYS,
  RECHECK_NEG_LISTINGS_INTERVAL,
  SCRAPE_SHOP_INTERVAL,
} from '../../constants.js';
import {
  CrawlEanProps,
  LookupCategoryProps,
  LookupInfoPropType,
  MatchProductsProps,
  QueryEansOnEbyProps,
  totalPositivAmazon,
  totalPositivEbay,
} from '@dipmaxtech/clr-pkg';
// a_origin setzen when infos ueber lookup ean

/*
1.  Crawl Shop
2.  Crawl Eans       
  - Herkunftsean von Sourc shop
3.1 Lookup Info  
  - sellerinformation(name, link, image, asin, buyBoxIsAmazon, costs, sellerRank), calculate marge
3.2 Match           
  - shop has no ean, match amazon,ebay, else ebay
3.3 Query Eans on Eby
  - query eans on ebay
3.4 Lookup Category
  - lookup category on ebay
4.1 Crawl Azn Listings
  - neg azn listings 
4.2 Crawl Eby Listings
  - neg eby listings
5.  Scan Shop
6.  Wholesale Search
  - search for wholesale products
7.  Daily Sales
  - daily sales
8.  Deals on Eby
  - pos deals on ebay
9.  Deals on Azn
  - pos deals on amazon

System of dependencies:
  - crawl ean depends on crawl shop 
    (updated in crawl fn after crawl shop)
  - match, lookup Info, query eans on eby depends on crawl ean 
    (updated in crawl ean fn after crawl ean)
  - lookup category depends on query eans on eby 
    (updated in query eans on eby fn after query eans on eby)
  - aznListings, ebyListings depends on match, lookup category, lookup info 
    (only initially, updated in consequent fn after match, lookup category, lookup info)
  - each task (excl. crawl) should update it's own progress in the beginning 
    and end of the task
*/

export type Query = {
  [key: string]: any;
};

export type Options = {
  limit?: number;
};

export type AggregationReturnTotalProps = {
  domain: string;
  returnTotal: boolean;
  limit: number | null;
};

/*               General                                       */

export const totalNegativAmazon = {
  $and: [
    { a_prc: { $gt: 0 } },
    { a_uprc: { $gt: 0 } },
    { a_mrgn: { $lte: 0 } },
    { a_mrgn_pct: { $lte: 0 } },
  ],
};

export const totalNegativEbay = {
  $and: [
    { e_prc: { $gt: 0 } },
    { e_uprc: { $gt: 0 } },
    { e_mrgn: { $lte: 0 } },
    { e_mrgn_pct: { $lte: 0 } },
  ],
};

export const progressField = {
  $or: [
    {
      progress: { $exists: false },
    },
    { progress: { $elemMatch: { pending: { $gt: 0 } } } },
  ],
};

export const startedAtField = (lowerThenStartedAt: string) => {
  return {
    $or: [
      { startedAt: { $exists: false } },
      { startedAt: '' },
      {
        startedAt: { $lt: lowerThenStartedAt },
      },
    ],
  };
};

/*               Aggregations                                   */

export const ebayMarginCalculationAggregationStep = [
  {
    $addFields: {
      e_mrgn: {
        $round: [
          {
            $subtract: [
              '$e_prc',
              {
                $add: [
                  {
                    $divide: [
                      {
                        $multiply: ['$prc', { $divide: ['$e_qty', '$qty'] }],
                      },
                      {
                        $add: [
                          1,
                          { $divide: [{ $ifNull: ['$tax', 19] }, 100] },
                        ],
                      },
                    ],
                  },
                  '$e_tax',
                  0,
                  0,
                  '$e_costs',
                ],
              },
            ],
          },
          2,
        ],
      },
    },
  },
  {
    $addFields: {
      e_mrgn_pct: {
        $round: [
          {
            $multiply: [
              {
                $divide: ['$e_mrgn', '$e_prc'],
              },
              100,
            ],
          },
          2,
        ],
      },
    },
  },
];
/*               General                                    */

const eanExistsQuery = { eanList: { $size: 1 } };
const eanNotExistsQuery = { eanList: { $exists: false } };

/*               Queries Crawl (1)                            */

export const scrapeShopTaskQueryFn = (interval: string, weekday: number) => {
  return [
    { type: TASK_TYPES.CRAWL_SHOP },
    { executing: { $eq: false } },
    { initialized: { $eq: true } },
    { weekday: { $eq: weekday } },
    {
      $or: [{ completedAt: '' }, { completedAt: { $lt: interval } }],
    },
  ];
};

export const initialScrapeShopTaskQueryFn = (
  start: string,
  weekday: number
) => {
  return [
    { type: TASK_TYPES.CRAWL_SHOP },
    { initialized: { $eq: false } },
    { executing: { $eq: false } },
    { weekday: { $eq: weekday } },
    {
      $or: [{ completedAt: '' }, { completedAt: { $lt: start } }],
    },
  ];
};

/*               Queries: Crawl Eans (2) - crawl-data         */

export const lockProductsForCrawlEanQuery = (
  taskId: ObjectId,
  domain: string,
  limit: number,
  action: Action
) => {
  let query: Query = {};
  let options: Options = {};

  if (action === 'recover') {
    query = {
      sdmn: domain,
      ean_taskId: setTaskId(taskId),
    };
  } else {
    query = countPendingProductsForCrawlEanQuery(domain);
    if (limit) {
      options['limit'] = limit;
    }
  }
  return { query, options };
};
export const setProductsLockedForCrawlEanQuery = (taskId: ObjectId) => {
  return {
    $set: {
      ean_taskId: setTaskId(taskId),
    },
  };
};
export const countPendingProductsForCrawlEanQuery = (domain: string) => {
  return {
    $and: [
      { sdmn: domain },
      { ean_taskId: { $exists: false } },
      eanNotExistsQuery,
      {
        $or: [
          { ean_prop: { $exists: false } },
          {
            $and: [
              {
                ean_prop: { $eq: CrawlEanProps.timeout },
                eanUpdatedAt: { $lt: subDateDaysISO(1) },
              },
            ],
          },
        ],
      },
    ],
  };
};
export const recoveryCrawlEanQuery = (taskId: ObjectId, domain: string) => {
  return { ean_taskId: setTaskId(taskId), sdmn: domain };
};
export const countTotalProductsForCrawlEanQuery = (domain: string) => {
  return { sdmn: domain };
};
export const crawlEanTaskQueryFn = (lowerThenStartedAt: string) => {
  return [
    { type: TASK_TYPES.CRAWL_EAN },
    { ...startedAtField(lowerThenStartedAt) },
    { recurrent: { $eq: true } },
    { ...progressField },
  ];
};

/*               Queries: Lookup Info (3.1) - crawl-data               */

export const lockProductsForLookupInfoQuery = (
  taskId: ObjectId,
  domain: string,
  limit: number,
  action: Action,
  hasEan?: boolean
) => {
  let query: Query = {};
  let options: Options = {};

  if (action === 'recover') {
    query = { info_taskId: setTaskId(taskId), sdmn: domain };
  } else {
    query = countPendingProductsLookupInfoQuery(domain, hasEan);

    if (limit) {
      options['limit'] = limit;
    }
  }
  return { query, options };
};
export const setProductsLockedForLookupInfoQuery = (taskId: ObjectId) => {
  return {
    $set: {
      info_taskId: setTaskId(taskId),
    },
  };
};
export const recoveryLookupInfoQuery = (taskId: ObjectId, domain: string) => {
  return { info_taskId: setTaskId(taskId), sdmn: domain };
};
export const lookupInfoStandardUpdate = (props?: {
  info_prop: LookupInfoPropType;
}) => {
  if (props) {
    return {
      $unset: {
        info_taskId: '',
      },
      $set: {
        infoUpdatedAt: new Date().toISOString(),
        info_prop: props.info_prop,
      },
    };
  } else {
    return {
      $set: {
        infoUpdatedAt: new Date().toISOString(),
      },
      $unset: {
        info_taskId: '',
      },
    };
  }
};
export const countPendingProductsLookupInfoQuery = (
  domain: string,
  hasEan?: boolean
) => {
  return {
    $and: [
      { sdmn: domain },
      { info_taskId: { $exists: false } },
      { info_prop: { $exists: false } },
      {
        ...(hasEan
          ? {
              $or: [eanExistsQuery, { asin: { $exists: true, $ne: '' } }],
            }
          : { asin: { $exists: true, $ne: '' } }),
      },
    ],
  };
};
export const countTotalProductsForLookupInfoQuery = (
  domain: string,
  hasEan?: boolean
) => {
  return {
    sdmn: domain,
    ...(hasEan
      ? {
          $or: [eanExistsQuery, { asin: { $exists: true, $ne: '' } }],
        }
      : { asin: { $exists: true, $ne: '' } }),
  };
};
export const lookupInfoTaskQueryFn = (lowerThenStartedAt: string) => {
  return [
    { type: TASK_TYPES.LOOKUP_INFO },
    { ...startedAtField(lowerThenStartedAt) },
    { recurrent: { $eq: true } },
    { ...progressField },
  ];
};

/*               Queries: Match (3.2) - crawl-data            */

export const lockProductsForMatchQuery = (
  taskId: ObjectId,
  domain: string,
  limit: number,
  action: Action,
  hasEan?: boolean
) => {
  const options: Options = {};
  let query: Query = {};

  if (action === 'recover') {
    query = {
      sdmn: domain,
      $or: [
        { azn_taskId: setTaskId(taskId) },
        {
          eby_taskId: setTaskId(taskId),
        },
      ],
    };
  } else {
    query = countPendingProductsForMatchQuery(domain, hasEan);
    if (limit) {
      options['limit'] = limit;
    }
  }
  return { query, options };
};
export const setProductsLockedForMatchQuery = (taskId: ObjectId) => {
  return {
    $set: {
      azn_taskId: setTaskId(taskId),
      eby_taskId: setTaskId(taskId),
    },
  };
};
export const countPendingProductsForMatchQuery = (
  domain: string,
  hasEan?: boolean
) => {
  let query: Query = {
    $and: [
      { sdmn: domain },
      {
        $or: [
          { azn_taskId: { $exists: false } },
          { eby_taskId: { $exists: false } },
        ],
      },
      {
        $or: [
          {
            azn_prop: {
              $nin: [MatchProductsProps.missing, MatchProductsProps.complete],
            },
          },
          {
            eby_prop: {
              $nin: [MatchProductsProps.missing, MatchProductsProps.complete],
            },
          },
        ],
      },
    ],
  };
  if (hasEan) {
    query['$and'].push(eanExistsQuery);
  }
  return query;
};
export const countTotalProductsForMatchQuery = (
  domain: string,
  hasEan?: boolean
) => {
  let query: Query = {
    sdmn: domain,
  };

  if (hasEan) {
    query = {
      ...query,
      ...eanExistsQuery,
    };
  }
  return query;
};
export const matchTaskQueryFn = (
  lowerThenStartedAt: string,
  danglingMatchThreshold: number
) => {
  return [
    { type: TASK_TYPES.MATCH_PRODUCTS },
    { ...startedAtField(lowerThenStartedAt) },
    { recurrent: { $eq: true } },
    {
      $or: [
        {
          progress: { $exists: false },
        },
        { 'progress.pending': { $gt: danglingMatchThreshold } },
      ],
    },
  ];
};

/*               Queries: Query Eans on Eby (3.3) - crawl-data   
                 eby_prop: complete/missing/empty, 
                 eby_prop: empty
                 ean: exists, 
                 ean: not empty, 
                 eby_locked: false,          
*/

export const lockProductsForQueryEansOnEbyQuery = (
  taskId: ObjectId,
  domain: string,
  limit: number,
  action: Action
) => {
  let query: Query = {};
  let options: Options = {};

  if (action === 'recover') {
    query = {
      sdmn: domain,
      eby_taskId: setTaskId(taskId),
    };
  } else {
    query = countPendingProductsQueryEansOnEbyQuery(domain);
    if (limit) {
      options['limit'] = limit;
    }
  }
  return { query, options };
};
export const setProductsLockedForQueryEansOnEbyQuery = (taskId: ObjectId) => {
  return {
    $set: {
      eby_taskId: setTaskId(taskId),
    },
  };
};
export const countPendingProductsQueryEansOnEbyQuery = (domain: string) => {
  return {
    $and: [
      { sdmn: domain },
      { eby_taskId: { $exists: false } },
      eanExistsQuery,
      { ean_prop: { $exists: true, $eq: CrawlEanProps.found } },
      { eby_prop: { $exists: false } },
    ],
  };
};
export const recoveryQueryEansOnEby = (taskId: ObjectId, domain: string) => {
  return { eby_taskId: setTaskId(taskId), sdmn: domain };
};
export const countTotalProductsForQueryEansOnEbyQuery = (domain: string) => {
  return {
    sdmn: domain,
    ...eanExistsQuery,
  };
};
export const queryEansOnEbyTaskQueryFn = (lowerThenStartedAt: string) => {
  return [
    { type: TASK_TYPES.QUERY_EANS_EBY },
    { ...startedAtField(lowerThenStartedAt) },
    { recurrent: { $eq: true } },
    { ...progressField },
  ];
};

/*              Queries: Lookup Category (3.4) - crawl-data           
                cat_prop: complete/missing/empty,
                esin: exists,not "",
                cat_locked: false
*/

export const lockProductsForLookupCategoryQuery = (
  taskId: ObjectId,
  domain: string,
  limit: number,
  action: Action
) => {
  let query: Query = {};
  let options: Options = {};

  if (action === 'recover') {
    query = recoveryLookupCategoryQuery(taskId, domain);
  } else {
    query = countPendingProductsForLookupCategoryQuery(domain);
    if (limit) {
      options['limit'] = limit;
    }
  }
  return { query, options };
};
export const setProductsLockedForLookupCategoryQuery = (taskId: ObjectId) => {
  return {
    $set: {
      cat_taskId: setTaskId(taskId),
    },
  };
};
export const countPendingProductsForLookupCategoryQuery = (domain: string) => {
  return {
    $and: [
      { sdmn: domain },
      { cat_taskId: { $exists: false } },
      {
        $or: [
          { cat_prop: { $exists: false } },
          { cat_prop: LookupCategoryProps.timeout },
        ],
      },
      {
        eby_prop: { $exists: true, $eq: QueryEansOnEbyProps.complete },
      },
      { esin: { $exists: true, $ne: '' } },
    ],
  };
};
export const recoveryLookupCategoryQuery = (
  taskId: ObjectId,
  domain: string
) => {
  return { cat_taskId: setTaskId(taskId), sdmn: domain };
};
export const countTotalProductsForLookupCategoryQuery = (domain: string) => {
  return {
    sdmn: domain,
    esin: { $exists: true, $ne: '' },
  };
};
export const lookupCategoryTaskQueryFn = (lowerThenStartedAt: string) => {
  return [
    { type: TASK_TYPES.LOOKUP_CATEGORY },
    { ...startedAtField(lowerThenStartedAt) },
    { recurrent: { $eq: true } },
    { ...progressField },
  ];
};

/*          Queries: Scrape Neg Azn listings (4.1) - arbispotter               */

export const pendingNegMarginAznListingsQuery = (domain: string) => {
  return {
    $and: [
      {
        sdmn: domain,
      },
      { azn_taskId: { $exists: false } },
      {
        asin: { $exists: true, $ne: '' },
      },
      {
        $or: [
          { aznUpdatedAt: { $exists: false } },
          {
            aznUpdatedAt: {
              $lt: subDateDaysISO(RECHECK_NEG_LISTINGS_INTERVAL),
            },
          },
        ],
      },
      { ...totalNegativAmazon },
    ],
  };
};
export const lockProductsForNegMarginAznListingsQuery = (
  taskId: ObjectId,
  domain: string,
  limit: number,
  action: Action
) => {
  let query: Query = {};
  let options: Options = {};
  if (action === 'recover') {
    query = recoveryNegMarginAznListingsQuery(taskId, domain);
  } else {
    query = pendingNegMarginAznListingsQuery(domain);
  }

  if (limit && action !== 'recover') {
    options['limit'] = limit;
  }
  return { options, query };
};
export const setProductsLockedForNegMarginAznListingsQuery = (
  taskId: ObjectId
) => {
  return {
    $set: {
      azn_taskId: setTaskId(taskId),
    },
  };
};
export const recoveryNegMarginAznListingsQuery = (
  taskId: ObjectId,
  domain: string
) => {
  return { azn_taskId: setTaskId(taskId), sdmn: domain };
};

export const countCompletedProductsForCrawlAznListingsQuery = () => {
  return {
    $and: [
      {
        asin: { $exists: true, $ne: '' },
      },
      {
        $or: [
          { aznUpdatedAt: { $exists: true } },
          {
            aznUpdatedAt: {
              $gte: subDateDaysISO(RECHECK_NEG_LISTINGS_INTERVAL),
            },
          },
        ],
      },
      { ...totalNegativAmazon },
    ],
  };
};
export const countTotalProductsNegMarginAznListingsQuery = (domain: string) => {
  return {
    $and: [
      {
        sdmn: domain,
      },
      { asin: { $exists: true, $ne: '' } },
      ...totalNegativAmazon.$and,
    ],
  };
};

export const crawlAznListingsTaskQueryFn = (lowerThenStartedAt: string) => {
  return [
    { type: TASK_TYPES.NEG_AZN_DEALS },
    { ...startedAtField(lowerThenStartedAt) },
    { recurrent: { $eq: true } },
    { ...progressField },
  ];
};

/*          Queries: Scrape Eby listings (4.2) - arbispotter       */

export const lockProductsForCrawlEbyListingsQuery = (
  limit: number,
  taskId: ObjectId,
  action: Action
) => {
  let query: Query = {};
  let options: Options = {};
  if (action === 'recover') {
    query['eby_taskId'] = setTaskId(taskId);
  } else {
    // @ts-ignore
    query = countPendingProductsForCrawlEbyListingsQuery();
  }

  if (limit && action !== 'recover') {
    options['limit'] = limit;
  }
  return { options, query };
};
export const setProductsLockedForNegMarginEbyListingsQuery = (
  taskId: ObjectId
) => {
  return {
    $set: {
      eby_taskId: setTaskId(taskId),
    },
  };
};
export const countPendingProductsForCrawlEbyListingsQuery = () => {
  const query = {
    $and: [
      { eby_taskId: { $exists: false } },
      {
        esin: { $exists: true, $ne: '' },
      },
      {
        ebyCategories: { $exists: true, $ne: [] },
      },
      {
        $or: [
          { ebyUpdatedAt: { $exists: false } },
          {
            ebyUpdatedAt: {
              $lt: subDateDaysISO(RECHECK_NEG_LISTINGS_INTERVAL),
            },
          },
        ],
      },
    ],
  };
  return query;
};
export const countCompletedProductsForCrawlEbyListingsQuery = () => {
  return {
    $and: [
      {
        esin: { $exists: true, $ne: '' },
      },
      {
        ebyCategories: { $exists: true, $ne: [] },
      },
      {
        $or: [
          { ebyUpdatedAt: { $exists: true } },
          {
            ebyUpdatedAt: {
              $gte: subDateDaysISO(RECHECK_NEG_LISTINGS_INTERVAL),
            },
          },
        ],
      },
    ],
  };
};
export const countTotalProductsCrawlEbyListingsQuery = {
  $and: [
    {
      esin: { $exists: true, $ne: '' },
    },
    {
      ebyCategories: { $exists: true, $ne: [] },
    },
  ],
};

/* Queries: Scrape Neg Eby listings (4.2) - aggregation - arbispotter */

const pendingScrapeEbyListingsMatchStage = [
  { eby_taskId: { $exists: false } },
  {
    esin: { $exists: true, $ne: '' },
  },
  {
    ebyCategories: { $exists: true, $ne: [] },
  },
  {
    $or: [
      { ebyUpdatedAt: { $exists: false } },
      { ebyUpdatedAt: { $lt: subDateDaysISO(RECHECK_NEG_LISTINGS_INTERVAL) } },
    ],
  },
  ...totalNegativEbay.$and,
];
export const lockProductsForNegMarginEbyListings = (
  taskId: ObjectId,
  domain: string,
  limit: number,
  action: Action
) => {
  let agg = [];
  if (action === 'recover') {
    agg.push({ $match: recoveryScrapeEbyListingsQuery(taskId) });
  } else {
    agg = countPendingProductsForNetMarginEbyListingsAgg({
      domain,
      returnTotal: false,
      limit: limit ? limit : 0,
    });
  }
  return agg;
};
export const countPendingProductsForNetMarginEbyListingsAgg = ({
  domain,
  returnTotal,
  limit,
}: AggregationReturnTotalProps) => {
  const agg: any[] = [
    { $match: { sdmn: domain } },
    ...ebayMarginCalculationAggregationStep,
    {
      $match: {
        $and: pendingScrapeEbyListingsMatchStage,
      },
    },
  ];
  if (returnTotal) {
    agg.push({ $count: 'total' });
  }
  if (limit) {
    agg.push({ $limit: limit });
  }
  return agg;
};
export const recoveryScrapeEbyListingsQuery = (taskId: ObjectId) => {
  return { eby_taskId: setTaskId(taskId) };
};
export const countTotalProductsNegMarginEbyListingsAgg = (domain: string) => [
  { $match: { sdmn: domain } },
  ...ebayMarginCalculationAggregationStep,
  {
    $match: {
      $and: [
        {
          esin: { $exists: true, $ne: '' },
        },
        {
          ebyCategories: { $exists: true, $ne: [] },
        },
        ...totalNegativEbay.$and,
      ],
    },
  },
  { $count: 'total' },
];

export const negMarginEbyListingsTaskQueryFn = (lowerThenStartedAt: string) => {
  return [
    { type: TASK_TYPES.NEG_EBY_DEALS },
    { ...startedAtField(lowerThenStartedAt) },
    { recurrent: { $eq: true } },
    { ...progressField },
  ];
};

/*               Queries: Scan (5)                              */

const scanTaskQuery = [
  { type: TASK_TYPES.SCAN_SHOP },
  { recurrent: { $eq: false } },
  { completed: { $eq: false } },
  { executing: { $eq: false } },
];

/*               Queries: Wholesale Azn  (6)                         */

export const countPendingProductsForWholesaleSearchQuery = (
  taskId: ObjectId
) => {
  const query = {
    $or: [
      {
        $and: [
          { taskIds: taskId.toString() },
          { target: 'a' },
          {
            sdmn: wholeSaleColname,
          },
          {
            a_lookup_pending: true,
          },
        ],
      },
      {
        $and: [
          { taskIds: taskId.toString() },
          { target: 'a' },
          {
            sdmn: wholeSaleColname,
          },
          { a_lookup_pending: false },
          {
            a_status: 'api',
          },
        ],
      },
    ],
  };
  return query;
};
export const countCompletedProductsForWholesaleSearchQuery = (
  taskId: ObjectId
) => {
  return {
    taskIds: taskId.toString(),
    target: 'a',
    sdmn: wholeSaleColname,
    a_status: {
      $in: ['complete', 'not found'],
    },
  };
};
const wholesaleTaskQuery = [
  { type: TASK_TYPES.WHOLESALE_SEARCH },
  { 'progress.pending': { $gt: 0 } },
];

/*               Queries: Wholesale Eby (6.1)                         */

export const countPendingProductsForWholesaleEbySearchQuery = (
  taskId: ObjectId
) => {
  const query = {
    taskIds: taskId.toString(),
    target: 'e',
    sdmn: wholeSaleColname,
    e_lookup_pending: true,
  };
  return query;
};
export const countCompletedProductsForWholesaleEbySearchQuery = (
  taskId: ObjectId
) => {
  return {
    taskIds: taskId.toString(),
    target: 'e',
    sdmn: wholeSaleColname,
    e_status: { $in: ['complete', 'not found'] },
  };
};

const wholesaleEbyTaskQuery = [
  { type: TASK_TYPES.WHOLESALE_EBY_SEARCH },
  { 'progress.pending': { $gt: 0 } },
];

/*               Daily Sales (7)                            */

export const crawlDailySalesQueryFn = (start: string) => {
  return [
    { type: TASK_TYPES.DAILY_SALES },
    {
      $and: [
        { recurrent: { $eq: true } },
        { executing: { $eq: false } },
        { completedAt: { $lt: start } },
      ],
    },
  ];
};

/*              Queries: deals on Eby (8) - arbispotter   
                  dealsEby
                 dealEbyUpdatedAt
                 dealEbyTaskId       

*/

export const lockProductsForDealsOnEbyAgg = (
  taskId: ObjectId,
  domain: string,
  limit: number,
  action: Action
) => {
  let agg = [];
  if (action === 'recover') {
    agg.push({ $match: { dealEbyTaskId: setTaskId(taskId) } });
  } else {
    agg = countPendingProductsForDealsOnEbyAgg({
      domain,
      returnTotal: false,
      limit: limit ? limit : null,
    });
  }
  return agg;
};
export const countPendingProductsForDealsOnEbyAgg = ({
  returnTotal,
  limit,
  domain,
}: AggregationReturnTotalProps) => {
  const agg: any[] = [
    { $match: { sdmn: domain } },
    ...ebayMarginCalculationAggregationStep,
    {
      $match: {
        $and: [
          {
            $or: [
              { dealEbyTaskId: { $exists: false } },
              { dealEbyTaskId: { $eq: '' } },
            ],
          },
          {
            esin: { $exists: true, $ne: '' },
          },
          {
            ebyCategories: { $exists: true, $ne: [] },
          },
          {
            $or: [
              { dealEbyUpdatedAt: { $exists: false } },
              { dealEbyUpdatedAt: { $lt: subDateDaysISO(DEALS_ON_EBY_DAYS) } },
            ],
          },
          ...totalPositivEbay.$and,
        ],
      },
    },
  ];

  if (returnTotal) {
    agg.push({ $count: 'total' });
  }

  if (limit) {
    agg.push({ $limit: limit });
  }
  return agg;
};
export const recoveryDealsOnEbyQuery = (taskId: ObjectId, domain: string) => {
  return { dealEbyTaskId: setTaskId(taskId), sdmn: domain };
};
export const countCompletedProductsForDealsOnEbyAgg = (domain: string) => [
  { $match: { sdmn: domain } },
  ...ebayMarginCalculationAggregationStep,
  {
    $match: {
      $and: [
        {
          esin: { $exists: true, $ne: '' },
        },
        {
          ebyCategories: { $exists: true, $ne: [] },
        },
        {
          $or: [
            { ebyUpdatedAt: { $exists: true } },
            { ebyUpdatedAt: { $gte: subDateDaysISO(DEALS_ON_EBY_DAYS) } },
          ],
        },
        ...totalPositivEbay.$and,
      ],
    },
  },
  { $count: 'total' },
];
export const setProductsLockedForDealsOnEbyQuery = (taskId: ObjectId) => {
  return {
    $set: {
      dealEbyTaskId: setTaskId(taskId),
    },
  };
};
export const countTotalProductsDealsOnEbyAgg = (domain: string) => [
  { $match: { sdmn: domain } },
  ...ebayMarginCalculationAggregationStep,
  {
    $match: {
      $and: [
        {
          esin: { $exists: true, $ne: '' },
        },
        {
          ebyCategories: { $exists: true, $ne: [] },
        },
        ...totalPositivEbay.$and,
      ],
    },
  },
  { $count: 'total' },
];
export const dealsOnEbyTaskQueryFn = (lowerThenStartedAt: string) => {
  return [
    { type: TASK_TYPES.DEALS_ON_EBY },
    { ...startedAtField(lowerThenStartedAt) },
    { recurrent: { $eq: true } },
    { ...progressField },
  ];
};

/*               Queries: deals on Azn (9) - arbispotter     
              dealsAzn
                dealAznUpdatedAt
                dealAznTaskId                   
*/

export const pendingDealsOnAznQuery = (domain: string) => {
  return {
    $and: [
      {
        sdmn: domain,
      },
      {
        $or: [
          { dealAznTaskId: { $exists: false } },
          { dealAznTaskId: { $eq: '' } },
        ],
      },
      {
        asin: { $exists: true, $ne: '' },
      },
      {
        $or: [
          { availUpdatedAt: { $exists: false } },
          { availUpdatedAt: { $lte: subDateDaysISO(DEALS_ON_AZN_DAYS) } },
        ],
      },
      ...totalPositivAmazon.$and,
    ],
  };
};
export const recoveryDealsOnAznQuery = (taskId: ObjectId, domain: string) => {
  return { dealAznTaskId: setTaskId(taskId), sdmn: domain };
};
export const lockProductsForDealsOnAznQuery = (
  taskId: ObjectId,
  domain: string,
  limit: number,
  action: Action
) => {
  let query: Query = {};
  let options: Options = {};
  if (action === 'recover') {
    query['dealAznTaskId'] = setTaskId(taskId);
  } else {
    query = pendingDealsOnAznQuery(domain);
  }

  if (limit && action !== 'recover') {
    options['limit'] = limit;
  }
  return { options, query };
};
export const setProductsLockedForDealsOnAznQuery = (taskId: ObjectId) => {
  return {
    $set: {
      dealAznTaskId: setTaskId(taskId),
    },
  };
};
export const countPendingProductsForDealsOnAznQuery = () => {
  return pendingDealsOnAznQuery;
};
export const countTotalProductsDealsOnAznQuery = (domain: string) => {
  return {
    $and: [
      { sdmn: domain },
      { asin: { $exists: true, $ne: '' } },
      ...totalPositivAmazon.$and,
    ],
  };
};
export const dealsOnAznTaskQueryFn = (lowerThenStartedAt: string) => {
  return [
    { type: TASK_TYPES.DEALS_ON_AZN },
    { ...startedAtField(lowerThenStartedAt) },
    { recurrent: { $eq: true } },
    { ...progressField },
  ];
};

/*   Queries: update product info (10) - arbispotter             */

export const lockProductsForUpdateProductinfoQuery = (
  taskId: ObjectId,
  limit: number,
  action: Action
) => {
  let query: Query = {};
  let options: Options = {};

  if (action === 'recover') {
    query['availTaskId'] = setTaskId(taskId);
  } else {
    // @ts-ignore
    query = countPendingProductsUpdateProductinfoAgg;
    if (limit) {
      options['limit'] = limit;
    }
  }
  return { query, options };
};
export const setProductsLockedForUpdateProductinfoQuery = (
  taskId: ObjectId
) => {
  return {
    $set: {
      availTaskId: setTaskId(taskId),
    },
  };
};

const availTaskPendingStages = [
  {
    $or: [
      { availUpdatedAt: { $exists: false } },
      { availUpdatedAt: { $lt: subDateDaysISO(1) } },
    ],
  },
  {
    $or: [{ availTaskId: { $exists: false } }, { availTaskId: '' }],
  },
];
const availTaskCompletedStage = [
  {
    $or: [
      { availUpdatedAt: { $exists: true } },
      { availUpdatedAt: { $gte: subDateDaysISO(1) } },
    ],
  },
];

export const countTotalProductsForUpdateProductinfoAgg = [
  {
    $facet: {
      ebay: [
        ...ebayMarginCalculationAggregationStep,
        {
          $match: { $and: [...totalPositivEbay.$and] },
        },
        { $count: 'total' },
      ],
      amazon: [
        {
          $match: {
            $and: [...totalPositivAmazon.$and],
          },
        },
        { $count: 'total' },
      ],
    },
  },
];
export const countPendingProductsUpdateProductinfoAgg = [
  {
    $facet: {
      ebay: [
        ...ebayMarginCalculationAggregationStep,
        {
          $match: {
            $and: [...totalPositivEbay.$and, ...availTaskPendingStages],
          },
        },
        { $count: 'total' },
      ],
      amazon: [
        {
          $match: {
            $and: [...totalPositivAmazon.$and, ...availTaskPendingStages],
          },
        },
        { $count: 'total' },
      ],
    },
  },
];
export const countCompletedProductsUpdateProductinfoAgg = [
  {
    $facet: {
      ebay: [
        ...ebayMarginCalculationAggregationStep,
        {
          $match: {
            $and: [...totalPositivEbay.$and, ...availTaskCompletedStage],
          },
        },
        { $count: 'total' },
      ],
      amazon: [
        {
          $match: {
            $and: [...totalPositivAmazon.$and, ...availTaskCompletedStage],
          },
        },
        { $count: 'total' },
      ],
    },
  },
];

/*               Queries: Tasks                                */

export const findTasksQuery = () => {
  const today = new Date();

  const fiveMinutesAgo = new Date();
  fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

  const oneMinuteAgo = new Date();
  oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);

  const danglingLookupThreshold =
    process.env.TEST === 'endtoend' ? 1 : DANGLING_LOOKUP_THRESHOLD;

  const danglingMatchThreshold =
    process.env.TEST === 'endtoend' ? 1 : DANGLING_MATCH_THRESHOLD;

  const lowerThenStartedAt = oneMinuteAgo.toISOString();

  const weekday = today.getDay();

  const start = startOfDay(today).toISOString();
  const scrapeShopInterval = subWeeks(
    today,
    SCRAPE_SHOP_INTERVAL
  ).toISOString();
  let update = {};

  update = {
    $push: {
      lastCrawler: hostname,
    },
    $set: {
      executing: true,
      startedAt: new Date().toISOString(),
    },
  };

  const scrapeShopTaskQuery = scrapeShopTaskQueryFn(
    scrapeShopInterval,
    weekday
  ); // (1)
  const initialScrapeShopTaskQuery = initialScrapeShopTaskQueryFn(
    start,
    weekday
  ); // (1.1)
  const dailySalesTaskQuery = crawlDailySalesQueryFn(start);
  const dealsOnEbyTaskQuery = dealsOnEbyTaskQueryFn(lowerThenStartedAt); // (8)
  const dealsOnAznTaskQuery = dealsOnAznTaskQueryFn(lowerThenStartedAt); // (9)

  const crawlEanTaskQuery = crawlEanTaskQueryFn(lowerThenStartedAt); // (2)
  const lookupInfoTaskQuery = lookupInfoTaskQueryFn(lowerThenStartedAt); // (3.1)
  const matchTaskQuery = matchTaskQueryFn(
    lowerThenStartedAt,
    danglingMatchThreshold
  ); // (3.2)
  const crawlAznListingsTaskQuery =
    crawlAznListingsTaskQueryFn(lowerThenStartedAt); // (4)
  const crawlEbyListingsTaskQuery =
    negMarginEbyListingsTaskQueryFn(lowerThenStartedAt); // (4.1)
  const queryEansOnEbyTaskQuery = queryEansOnEbyTaskQueryFn(lowerThenStartedAt); // (3.3)
  const lookupCategoryTaskQuery = lookupCategoryTaskQueryFn(lowerThenStartedAt); // (3.4)

  const prioQuery = {
    $and: [
      {
        maintenance: false,
      },
      {
        $or: [
          {
            $and: [
              ...initialScrapeShopTaskQuery,
              { cooldown: { $lt: new Date().toISOString() } },
            ],
          },
          {
            $and: [
              ...scrapeShopTaskQuery,
              { cooldown: { $lt: new Date().toISOString() } },
            ],
          },
          {
            $and: dailySalesTaskQuery,
          },
          {
            $and: dealsOnAznTaskQuery,
          },
          {
            $and: dealsOnEbyTaskQuery,
          },
        ],
      },
    ],
  };

  const query = {
    $and: [
      {
        maintenance: false,
      },
      {
        $or: [
          {
            $and: scanTaskQuery,
          },
          {
            $and: [
              ...wholesaleTaskQuery,
              { cooldown: { $lt: new Date().toISOString() } },
            ],
          },
          {
            $and: [
              ...wholesaleEbyTaskQuery,
              { cooldown: { $lt: new Date().toISOString() } },
            ],
          },
          {
            $and: [
              ...crawlEanTaskQuery,
              { cooldown: { $lt: new Date().toISOString() } },
            ],
          },
          {
            $and: [
              ...queryEansOnEbyTaskQuery,
              { cooldown: { $lt: new Date().toISOString() } },
            ],
          },
          {
            $and: [
              ...lookupInfoTaskQuery,
              { cooldown: { $lt: new Date().toISOString() } },
            ],
          },
          {
            $and: [
              ...lookupCategoryTaskQuery,
              { cooldown: { $lt: new Date().toISOString() } },
            ],
          },
          {
            $and: [
              ...matchTaskQuery,
              { cooldown: { $lt: new Date().toISOString() } },
            ],
          },
        ],
      },
    ],
  };

  const fallbackQuery = {
    $and: [
      {
        maintenance: true, // TODO: change to false
      },
      {
        $or: [
          // {
          //   $and: matchTaskQuery,
          // },
          {
            $and: wholesaleTaskQuery,
          },
          // {
          //   $and: wholesaleEbyTaskQuery,
          // },
          // {
          //   $and: queryEansOnEbyTaskQuery,
          // },
          // { $and: crawlEanTaskQuery },
          // { $and: lookupInfoTaskQuery },
          // {
          //   $and: lookupCategoryTaskQuery,
          // },
          // { $and: crawlAznListingsTaskQuery },
          // { $and: crawlEbyListingsTaskQuery },
        ],
      },
    ],
  };

  return {
    prioQuery,
    query,
    fallbackQuery,
    update,
    danglingMatchThreshold,
    danglingLookupThreshold,
  };
};

/*               Helper Functions                             */

export const setTaskId = (taskId: ObjectId) => {
  return `${hostname}:${taskId.toString()}`;
};
