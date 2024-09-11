import { startOfDay } from "date-fns";
import { subDateDaysISO } from "../../../util/dates.js";
import { hostname } from "../mongo.js";
import {
  DANGLING_LOOKUP_THRESHOLD,
  DANGLING_MATCH_THRESHOLD,
} from "../../../constants.js";
import { UTCDate } from "@date-fns/utc";
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

/*               General                                       */

export const totalPositivAmazon = {
  $and: [
    { a_pblsh: true },
    { a_prc: { $gt: 0 } },
    { a_uprc: { $gt: 0 } },
    { a_mrgn: { $gt: 0 } },
    { a_mrgn_pct: { $gt: 0 } },
  ],
};
export const totalNegativAmazon = {
  $and: [
    { a_prc: { $gt: 0 } },
    { a_uprc: { $gt: 0 } },
    { a_mrgn: { $lte: 0 } },
    { a_mrgn_pct: { $lte: 0 } },
  ],
};
export const totalPositivEbay = {
  $and: [
    { e_pblsh: true },
    { e_prc: { $gt: 0 } },
    { e_uprc: { $gt: 0 } },
    { e_mrgn: { $gt: 0 } },
    { e_mrgn_pct: { $gt: 0 } },
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

export const startedAtField = (lowerThenStartedAt) => {
  return {
    $or: [
      { startedAt: { $exists: false } },
      { startedAt: "" },
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
              "$e_prc",
              {
                $add: [
                  {
                    $divide: [
                      {
                        $multiply: ["$prc", { $divide: ["$e_qty", "$qty"] }],
                      },
                      {
                        $add: [
                          1,
                          { $divide: [{ $ifNull: ["$tax", 19] }, 100] },
                        ],
                      },
                    ],
                  },
                  "$e_tax",
                  0,
                  0,
                  "$e_costs",
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
                $divide: ["$e_mrgn", "$e_prc"],
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

const eanExistsQuery = [
  { ean: { $exists: true, $ne: "" } },
  { eanList: { $size: 1 } },
];
const eanNotExistsQuery = {
  $and: [
    {
      $or: [{ ean: { $exists: false } }, { ean: { $exists: true, $eq: "" } }],
    },
    { $or: [{ eanList: { $exists: false } }, { eanList: { $size: 0 } }] },
  ],
};

/*               Queries Crawl (1)                            */

export const crawlShopTaskQueryFn = (start, weekday) => {
  return [
    { type: "CRAWL_SHOP" },
    { recurrent: { $eq: true } },
    { executing: { $eq: false } },
    { weekday: { $eq: weekday } },
    {
      $or: [{ completedAt: "" }, { completedAt: { $lt: start } }],
    },
  ];
};

/*               Queries: Crawl Eans (2) - crawl-data         */

export const lockProductsForCrawlEanQuery = (taskId, limit, action) => {
  let query = {};
  let options = {};

  if (action === "recover") {
    query["ean_taskId"] = setTaskId(taskId);
  } else {
    // @ts-ignore
    query = countPendingProductsForCrawlEanQuery;

    if (limit) {
      options["limit"] = limit;
    }
  }
  return { query, options };
};
export const setProductsLockedForCrawlEanQuery = (taskId) => {
  return {
    $set: recoveryCrawlEanQuery(taskId),
  };
};
export const countPendingProductsForCrawlEanQuery = {
  $and: [
    { ean_taskId: { $exists: false } },
    { ...eanNotExistsQuery },
    {
      $or: [{ ean_prop: { $exists: false } }, { ean_prop: { $eq: "" } }],
    },
  ],
};
export const recoveryCrawlEanQuery = (taskId) => {
  return { ean_taskId: setTaskId(taskId) };
};
export const countTotalProductsForCrawlEanQuery = {};
export const crawlEanTaskQueryFn = (lowerThenStartedAt) => {
  return [
    { type: "CRAWL_EAN" },
    { ...startedAtField(lowerThenStartedAt) },
    { recurrent: { $eq: true } },
    { ...progressField },
  ];
};

/*               Queries: Lookup Info (3.1) - crawl-data               */

export const lockProductsForLookupInfoQuery = (
  taskId,
  limit,
  action,
  hasEan
) => {
  let query = {};
  let options = {};

  if (action === "recover") {
    query["info_taskId"] = setTaskId(taskId);
  } else {
    // @ts-ignore
    query = countPendingProductsLookupInfoQuery(hasEan);

    if (limit) {
      options["limit"] = limit;
    }
  }
  return { query, options };
};
export const setProductsLockedForLookupInfoQuery = (taskId) => {
  return {
    $set: recoveryLookupInfoQuery(taskId),
  };
};
export const recoveryLookupInfoQuery = (taskId) => {
  return { info_taskId: setTaskId(taskId) };
};
export const countPendingProductsLookupInfoQuery = (hasEan) => {
  const query = {
    $and: [
      { info_taskId: { $exists: false } },
      {
        $or: [{ info_prop: { $exists: false } }, { info_prop: { $eq: "" } }],
      },
    ],
  };

  if (hasEan) {
    query.$and.push({
      $or: [
        {
          // @ts-ignore
          $or: eanExistsQuery,
        },
        // @ts-ignore
        { asin: { $exists: true, $ne: "" } },
      ],
    });
  } else {
    // @ts-ignore
    query.$and.push({ asin: { $exists: true, $ne: "" } });
  }

  return query;
};
export const countTotalProductsForLookupInfoQuery = (hasEan) => {
  let query = {};

  if (hasEan) {
    query["$or"] = [
      {
        $or: eanExistsQuery,
      },
      { asin: { $exists: true, $ne: "" } },
    ];
  } else {
    query["asin"] = {
      $exists: true,
      $ne: "",
    };
  }
  return query;
};
export const lookupInfoTaskQueryFn = (lowerThenStartedAt) => {
  return [
    { type: "LOOKUP_INFO" },
    { ...startedAtField(lowerThenStartedAt) },
    { recurrent: { $eq: true } },
    { ...progressField },
  ];
};

/*               Queries: Match (3.2) - crawl-data            */

export const lockProductsForMatchQuery = (limit, taskId, action, hasEan) => {
  const options = {};
  let query = {};

  if (action === "recover") {
    query["taskId"] = setTaskId(taskId);
  } else {
    // @ts-ignore
    query = countPendingProductsForMatchQuery(hasEan);
    if (limit) {
      options["limit"] = limit;
    }
  }
  return { query, options };
};
export const setProductsLockedForMatchQuery = (taskId) => {
  return {
    $set: {
      locked: true,
      taskId: setTaskId(taskId),
    },
  };
};
export const countPendingProductsForMatchQuery = (hasEan) => {
  const twentyFourAgo = subDateDaysISO(1);
  let query = {
    $and: [
      { taskId: { $exists: false } },
      { $or: [{ matched: { $exists: false } }, { matched: { $eq: false } }] },
      {
        $or: [
          { matchedAt: { $exists: false } },
          { matchedAt: { $lte: twentyFourAgo } },
        ],
      },
    ],
  };
  if (hasEan) {
    // @ts-ignore
    query["$and"].push({ $or: eanExistsQuery });
  }
  return query;
};
export const countTotalProductsForMatchQuery = (hasEan) => {
  let query = {};

  if (hasEan) {
    query["$or"] = eanExistsQuery;
  }
  return query;
};
export const matchTaskQueryFn = (
  lowerThenStartedAt,
  danglingMatchThreshold
) => {
  return [
    { type: "MATCH_PRODUCTS" },
    { ...startedAtField(lowerThenStartedAt) },
    { recurrent: { $eq: true } },
    {
      $or: [
        {
          progress: { $exists: false },
        },
        { "progress.pending": { $gt: danglingMatchThreshold } },
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

export const lockProductsForQueryEansOnEbyQuery = (taskId, limit, action) => {
  let query = {};
  let options = {};

  if (action === "recover") {
    query["eby_taskId"] = setTaskId(taskId);
  } else {
    // @ts-ignore
    query = countPendingProductsQueryEansOnEbyQuery;
    if (limit) {
      options["limit"] = limit;
    }
  }
  return { query, options };
};
export const setProductsLockedForQueryEansOnEbyQuery = (taskId) => {
  return {
    $set: {
      eby_taskId: setTaskId(taskId),
    },
  };
};
export const countPendingProductsQueryEansOnEbyQuery = {
  $and: [
    { eby_taskId: { $exists: false } },
    {
      $or: eanExistsQuery,
    },
    {
      $or: [{ eby_prop: { $exists: false } }, { eby_prop: { $eq: "" } }],
    },
  ],
};
export const recoveryQueryEansOnEby = (taskId) => {
  return { eby_taskId: setTaskId(taskId) };
};
export const countTotalProductsForQueryEansOnEbyQuery = {
  $or: eanExistsQuery,
};
export const queryEansOnEbyTaskQueryFn = (lowerThenStartedAt) => {
  return [
    { type: "QUERY_EANS_EBY" },
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

export const lockProductsForLookupCategoryQuery = (taskId, limit, action) => {
  let query = {};
  let options = {};

  if (action === "recover") {
    query = recoveryLookupCategoryQuery(taskId);
  } else {
    query = countPendingProductsForLookupCategoryQuery;
    if (limit) {
      options["limit"] = limit;
    }
  }
  return { query, options };
};

export const setProductsLockedForLookupCategoryQuery = (taskId) => {
  return {
    $set: {
      cat_taskId: setTaskId(taskId),
    },
  };
};
export const countPendingProductsForLookupCategoryQuery = {
  $and: [
    { cat_taskId: { $exists: false } },
    {
      $or: [
        { cat_prop: { $exists: false } },
        { cat_prop: { $in: ["", "timeout"] } },
      ],
    },
    {
      eby_prop: { $exists: true, $eq: "complete" },
    },
    { esin: { $exists: true, $ne: "" } },
  ],
};
export const recoveryLookupCategoryQuery = (taskId) => {
  return { cat_taskId: setTaskId(taskId) };
};
export const countTotalProductsForLookupCategoryQuery = {
  esin: { $exists: true, $ne: "" },
};
export const lookupCategoryTaskQueryFn = (lowerThenStartedAt) => {
  return [
    { type: "LOOKUP_CATEGORY" },
    { ...startedAtField(lowerThenStartedAt) },
    { recurrent: { $eq: true } },
    { ...progressField },
  ];
};

/*          Queries: Scrape Neg Azn listings (4.1) - arbispotter               */

export const pendingScrapeAznListingsQuery = {
  $and: [
    { azn_taskId: { $exists: false } },
    {
      asin: { $exists: true, $ne: "" },
    },
    {
      $or: [
        { aznUpdatedAt: { $exists: false } },
        { aznUpdatedAt: { $lt: subDateDaysISO(7) } },
      ],
    },
    { ...totalNegativAmazon },
  ],
};
export const lockProductsForCrawlAznListingsQuery = (limit, taskId, action) => {
  let query = {};
  let options = {};
  if (action === "recover") {
    query = recoveryCrawlAznListingsQuery(taskId);
  } else {
    query = countPendingProductsForCrawlAznListingsQuery();
  }

  if (limit && action !== "recover") {
    options["limit"] = limit;
  }
  return { options, query };
};
export const setProductsLockedForCrawlAznListingsQuery = (taskId) => {
  return {
    $set: {
      azn_taskId: setTaskId(taskId),
    },
  };
};
export const recoveryCrawlAznListingsQuery = (taskId) => {
  return { azn_taskId: setTaskId(taskId) };
};
export const countPendingProductsForCrawlAznListingsQuery = () => {
  return pendingScrapeAznListingsQuery;
};
export const countCompletedProductsForCrawlAznListingsQuery = () => {
  return {
    $and: [
      {
        asin: { $exists: true, $ne: "" },
      },
      {
        $or: [
          { aznUpdatedAt: { $exists: true } },
          { aznUpdatedAt: { $gte: subDateDaysISO(7) } },
        ],
      },
      { ...totalNegativAmazon },
    ],
  };
};
export const countTotalProductsCrawlAznListingsQuery = {
  $and: [{ asin: { $exists: true, $ne: "" } }, ...totalNegativAmazon.$and],
};
export const crawlAznListingsTaskQueryFn = (lowerThenStartedAt) => {
  return [
    { type: "CRAWL_AZN_LISTINGS" },
    { ...startedAtField(lowerThenStartedAt) },
    { recurrent: { $eq: true } },
    { ...progressField },
  ];
};

/*          Queries: Scrape Eby listings (4.2) - arbispotter       */

export const lockProductsForCrawlEbyListingsQuery = (limit, taskId, action) => {
  let query = {};
  let options = {};
  if (action === "recover") {
    query["eby_taskId"] = setTaskId(taskId);
  } else {
    // @ts-ignore
    query = countPendingProductsForCrawlEbyListingsQuery();
  }

  if (limit && action !== "recover") {
    options["limit"] = limit;
  }
  return { options, query };
};
export const setProductsLockedForCrawlEbyListingsQuery = (taskId) => {
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
        esin: { $exists: true, $ne: "" },
      },
      {
        ebyCategories: { $exists: true, $ne: [] },
      },
      {
        $or: [
          { ebyUpdatedAt: { $exists: false } },
          { ebyUpdatedAt: { $lt: subDateDaysISO(7) } },
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
        esin: { $exists: true, $ne: "" },
      },
      {
        ebyCategories: { $exists: true, $ne: [] },
      },
      {
        $or: [
          { ebyUpdatedAt: { $exists: true } },
          { ebyUpdatedAt: { $gte: subDateDaysISO(7) } },
        ],
      },
    ],
  };
};
export const countTotalProductsCrawlEbyListingsQuery = {
  $and: [
    {
      esin: { $exists: true, $ne: "" },
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
    esin: { $exists: true, $ne: "" },
  },
  {
    ebyCategories: { $exists: true, $ne: [] },
  },
  {
    $or: [
      { ebyUpdatedAt: { $exists: false } },
      { ebyUpdatedAt: { $lt: subDateDaysISO(7) } },
    ],
  },
  ...totalNegativEbay.$and,
];
export const lockProductsForCrawlEbyListingsAggregation = (
  limit,
  taskId,
  action
) => {
  let agg = [];
  if (action === "recover") {
    agg.push({ $match: recoveryScrapeEbyListingsQuery(taskId) });
  } else {
    agg = countPendingProductsForCrawlEbyListingsAggregation({
      returnTotal: false,
      limit: limit && action !== "recover" ? limit : null,
    });
  }
  return agg;
};
export const countPendingProductsForCrawlEbyListingsAggregation = ({
  returnTotal,
  limit,
}) => {
  const agg = [
    ...ebayMarginCalculationAggregationStep,
    {
      $match: {
        $and: pendingScrapeEbyListingsMatchStage,
      },
    },
  ];
  if (returnTotal) {
    // @ts-ignore
    agg.push({ $count: "total" });
  }
  if (limit) {
    // @ts-ignore
    agg.push({ $limit: limit });
  }
  return agg;
};
export const recoveryScrapeEbyListingsQuery = (taskId) => {
  return { eby_taskId: setTaskId(taskId) };
};
export const countCompletedProductsForCrawlEbyListingsAggregation = [
  ...ebayMarginCalculationAggregationStep,
  {
    $match: {
      $and: [
        {
          esin: { $exists: true, $ne: "" },
        },
        {
          ebyCategories: { $exists: true, $ne: [] },
        },
        {
          $or: [
            { ebyUpdatedAt: { $exists: true } },
            { ebyUpdatedAt: { $gte: subDateDaysISO(7) } },
          ],
        },
        ...totalNegativEbay.$and,
      ],
    },
  },
  { $count: "total" },
];
export const countTotalProductsCrawlEbyListingsAggregation = [
  ...ebayMarginCalculationAggregationStep,
  {
    $match: {
      $and: [
        {
          esin: { $exists: true, $ne: "" },
        },
        {
          ebyCategories: { $exists: true, $ne: [] },
        },
        ...totalNegativEbay.$and,
      ],
    },
  },
  { $count: "total" },
];
export const crawlEbyListingsTaskQueryFn = (lowerThenStartedAt) => {
  return [
    { type: "CRAWL_EBY_LISTINGS" },
    { ...startedAtField(lowerThenStartedAt) },
    { recurrent: { $eq: true } },
    { ...progressField },
  ];
};

/*               Queries: Scan (5)                              */

const scanTaskQuery = [
  { type: "SCAN_SHOP" },
  { recurrent: { $eq: false } },
  { completed: { $eq: false } },
  { executing: { $eq: false } },
];

/*               Queries: Wholesale  (6)                         */

export const countPendingProductsForWholesaleSearchQuery = (taskId) => {
  const query = {
    taskId: taskId.toString(),
    lookup_pending: true,
    locked: false,
  };
  return query;
};
export const countCompletedProductsForWholesaleSearchQuery = (taskId) => {
  return {
    taskId: taskId.toString(),
    status: { $in: ["complete", "not found"] },
  };
};
const wholesaleTaskQuery = [
  { type: "WHOLESALE_SEARCH" },
  { "progress.pending": { $gt: 0 } },
];

/*               Daily Sales (7)                            */

export const crawlDailySalesQueryFn = (start) => {
  return [
    { type: "DAILY_SALES" },
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

export const lockProductsForDealsOnEbyAgg = (taskId, limit, action) => {
  let agg = [];
  if (action === "recover") {
    agg.push({ $match: { dealEbyTaskId: setTaskId(taskId) } });
  } else {
    agg = countPendingProductsForDealsOnEbyAgg({
      returnTotal: false,
      limit: limit && action !== "recover" ? limit : null,
    });
  }
  return agg;
};
export const countPendingProductsForDealsOnEbyAgg = ({
  returnTotal,
  limit,
}) => {
  const agg = [
    ...ebayMarginCalculationAggregationStep,
    {
      $match: {
        $and: [
          {
            $or: [
              { dealEbyTaskId: { $exists: false } },
              { dealEbyTaskId: { $eq: "" } },
            ],
          },
          {
            esin: { $exists: true, $ne: "" },
          },
          {
            ebyCategories: { $exists: true, $ne: [] },
          },
          {
            $or: [
              { dealEbyUpdatedAt: { $exists: false } },
              { dealEbyUpdatedAt: { $lt: subDateDaysISO(1) } },
            ],
          },
          ...totalPositivEbay.$and,
        ],
      },
    },
  ];
  if (returnTotal) {
    // @ts-ignore
    agg.push({ $count: "total" });
  }
  if (limit) {
    // @ts-ignore
    agg.push({ $limit: limit });
  }
  return agg;
};
export const recoveryDealsOnEbyQuery = (taskId) => {
  return { dealEbyTaskId: setTaskId(taskId) };
};
export const countCompletedProductsForDealsOnEbyAgg = [
  ...ebayMarginCalculationAggregationStep,
  {
    $match: {
      $and: [
        {
          esin: { $exists: true, $ne: "" },
        },
        {
          ebyCategories: { $exists: true, $ne: [] },
        },
        {
          $or: [
            { ebyUpdatedAt: { $exists: true } },
            { ebyUpdatedAt: { $gte: subDateDaysISO(7) } },
          ],
        },
        ...totalPositivEbay.$and,
      ],
    },
  },
  { $count: "total" },
];
export const setProductsLockedForDealsOnEbyQuery = (taskId) => {
  return {
    $set: recoveryDealsOnEbyQuery(taskId),
  };
};
export const countTotalProductsDealsOnEbyAgg = [
  ...ebayMarginCalculationAggregationStep,
  {
    $match: {
      $and: [
        {
          esin: { $exists: true, $ne: "" },
        },
        {
          ebyCategories: { $exists: true, $ne: [] },
        },
        ...totalPositivEbay.$and,
      ],
    },
  },
  { $count: "total" },
];
export const dealsOnEbyTaskQueryFn = (lowerThenStartedAt) => {
  return [
    { type: "DEALS_ON_EBY" },
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

export const pendingDealsOnAznQuery = {
  $and: [
    {
      $or: [
        { dealAznTaskId: { $exists: false } },
        { dealAznTaskId: { $eq: "" } },
      ],
    },
    {
      asin: { $exists: true, $ne: "" },
    },
    {
      $or: [
        { dealAznUpdatedAt: { $exists: false } },
        { dealAznUpdatedAt: { $lte: subDateDaysISO(1) } },
      ],
    },
    ...totalPositivAmazon.$and,
  ],
};
export const recoveryDealsOnAznQuery = (taskId) => {
  return { dealAznTaskId: setTaskId(taskId) };
};
export const lockProductsForDealsOnAznQuery = (limit, taskId, action) => {
  let query = {};
  let options = {};
  if (action === "recover") {
    query["azn_taskId"] = setTaskId(taskId);
  } else {
    // @ts-ignore
    query = pendingDealsOnAznQuery;
  }

  if (limit && action !== "recover") {
    options["limit"] = limit;
  }
  return { options, query };
};
export const setProductsLockedForDealsOnAznQuery = (taskId) => {
  return {
    $set: recoveryDealsOnAznQuery(taskId),
  };
};
export const countPendingProductsForDealsOnAznQuery = () => {
  return pendingDealsOnAznQuery;
};
export const countCompletedProductsForDealsOnAznQuery = () => {
  return {
    $and: [
      {
        asin: { $exists: true, $ne: "" },
      },
      {
        $or: [
          { aznUpdatedAt: { $exists: true } },
          { aznUpdatedAt: { $gte: subDateDaysISO(7) } },
        ],
      },
      totalPositivAmazon.$and,
    ],
  };
};
export const countTotalProductsDealsOnAznQuery = {
  $and: [{ asin: { $exists: true, $ne: "" } }, ...totalPositivAmazon.$and],
};
export const dealsOnAznTaskQueryFn = (lowerThenStartedAt) => {
  return [
    { type: "DEALS_ON_AZN" },
    { ...startedAtField(lowerThenStartedAt) },
    { recurrent: { $eq: true } },
    { ...progressField },
  ];
};

/*   Queries: update product info (10) - arbispotter             */

export const lockProductsForUpdateProductinfoQuery = (
  taskId,
  limit,
  action
) => {
  let query = {};
  let options = {};

  if (action === "recover") {
    query["availTaskId"] = setTaskId(taskId);
  } else {
    // @ts-ignore
    query = countPendingProductsUpdateProductinfoAgg;
    if (limit) {
      options["limit"] = limit;
    }
  }
  return { query, options };
};
export const setProductsLockedForUpdateProductinfoQuery = (taskId) => {
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
    $or: [{ availTaskId: { $exists: false } }, { availTaskId: "" }],
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
        { $count: "total" },
      ],
      amazon: [
        {
          $match: {
            $and: [...totalPositivAmazon.$and],
          },
        },
        { $count: "total" },
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
        { $count: "total" },
      ],
      amazon: [
        {
          $match: {
            $and: [...totalPositivAmazon.$and, ...availTaskPendingStages],
          },
        },
        { $count: "total" },
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
        { $count: "total" },
      ],
      amazon: [
        {
          $match: {
            $and: [...totalPositivAmazon.$and, ...availTaskCompletedStage],
          },
        },
        { $count: "total" },
      ],
    },
  },
];

export const updateProductinfoTaskQueryFn = (start, danglingMatchThreshold) => {
  return [
    { type: "UPDATE_PRODUCT_INFO" },
    {
      $or: [{ completedAt: "" }, { completedAt: { $lt: start } }],
    },
    { recurrent: { $eq: true } },
    { ...progressField },
  ];
};

/*               Queries: Tasks                                */

export const findTasksQuery = () => {
  const today = new UTCDate();

  const fiveMinutesAgo = new UTCDate();
  fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

  const oneMinuteAgo = new UTCDate();
  oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);

  const danglingLookupThreshold =
    process.env.TEST === "endtoend" ? 1 : DANGLING_LOOKUP_THRESHOLD;

  const danglingMatchThreshold =
    process.env.TEST === "endtoend" ? 1 : DANGLING_MATCH_THRESHOLD;

  const lowerThenStartedAt = oneMinuteAgo.toISOString();

  const weekday = today.getDay();

  const start = startOfDay(today).toISOString();
  let update = {};

  update = {
    $push: {
      lastCrawler: hostname,
    },
    $set: {
      executing: true,
      startedAt: new UTCDate().toISOString(),
    },
  };

  const crawlShopTaskQuery = crawlShopTaskQueryFn(start, weekday); // (1)
  const dailySalesTaskQuery = crawlDailySalesQueryFn(start);
  const dealsOnEbyTaskQuery = dealsOnEbyTaskQueryFn(lowerThenStartedAt); // (8)
  const dealsOnAznTaskQuery = dealsOnAznTaskQueryFn(lowerThenStartedAt); // (9)

  const crawlEanTaskQuery = crawlEanTaskQueryFn(lowerThenStartedAt); // (2)
  const lookupInfoTaskQuery = lookupInfoTaskQueryFn(lowerThenStartedAt); // (3.1)
  const matchTaskQuery = matchTaskQueryFn(
    // (3.2)
    lowerThenStartedAt,
    danglingMatchThreshold
  );
  const crawlAznListingsTaskQuery =
    crawlAznListingsTaskQueryFn(lowerThenStartedAt); // (4)
  const crawlEbyListingsTaskQuery =
    crawlEbyListingsTaskQueryFn(lowerThenStartedAt); // (4.1)
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
            $and: crawlShopTaskQuery,
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
              { cooldown: { $lt: new UTCDate().toISOString() } },
            ],
          },
          {
            $and: [
              ...crawlEanTaskQuery,
              { cooldown: { $lt: new UTCDate().toISOString() } },
            ],
          },
          {
            $and: [
              ...queryEansOnEbyTaskQuery,
              { cooldown: { $lt: new UTCDate().toISOString() } },
            ],
          },
          {
            $and: [
              ...lookupInfoTaskQuery,
              { cooldown: { $lt: new UTCDate().toISOString() } },
            ],
          },
          {
            $and: [
              ...lookupCategoryTaskQuery,
              { cooldown: { $lt: new UTCDate().toISOString() } },
            ],
          },
          {
            $and: [
              ...matchTaskQuery,
              { cooldown: { $lt: new UTCDate().toISOString() } },
            ],
          },
        ],
      },
    ],
  };

  const fallbackQuery = {
    $and: [
      {
        maintenance: false,
      },
      {
        $or: [
          {
            $and: matchTaskQuery,
          },
          {
            $and: wholesaleTaskQuery,
          },
          {
            $and: queryEansOnEbyTaskQuery,
          },
          { $and: crawlEanTaskQuery },
          { $and: lookupInfoTaskQuery },
          {
            $and: lookupCategoryTaskQuery,
          },
          { $and: crawlAznListingsTaskQuery },
          { $and: crawlEbyListingsTaskQuery },
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

export const setTaskId = (taskId) => {
  return `${hostname}:${taskId.toString()}`;
};
