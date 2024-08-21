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
  - crawl amazon listings 
4.2 Crawl Eby Listings
  - crawl ebay listings

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
    query["ean_taskId"] = `${hostname}:${taskId.toString()}`;
  } else {
    query = countPendingProductsForCrawlEanQuery;

    if (limit) {
      options["limit"] = limit;
    }
  }
  return { query, options };
};
export const setProductsLockedForCrawlEanQuery = (taskId) => {
  return {
    $set: {
      ean_taskId: `${hostname}:${taskId.toString()}`,
    },
  };
};
export const countPendingProductsForCrawlEanQuery = {
  $and: [
    { ean_taskId: { $exists: false } },
    {
      $or: [{ ean: { $exists: false } }, { ean: { $exists: true, $eq: "" } }],
    },
    {
      $or: [{ ean_prop: { $exists: false } }, { ean_prop: { $eq: "" } }],
    },
  ],
};
export const countTotalProductsForCrawlEanQuery = {};

export const crawlEanTaskQueryFn = (lowerThenStartedAt) => {
  return [
    { type: "CRAWL_EAN" },
    {
      $or: [
        { startedAt: { $exists: false } },
        { startedAt: "" },
        {
          startedAt: { $lt: lowerThenStartedAt },
        },
      ],
    },
    { recurrent: { $eq: true } },
    {
      $or: [
        {
          progress: { $exists: false },
        },
        { progress: { $elemMatch: { pending: { $gt: 0 } } } },
      ],
    },
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
    query["info_taskId"] = `${hostname}:${taskId.toString()}`;
  } else {
    query = countPendingProductsLookupInfoQuery(hasEan);

    if (limit) {
      options["limit"] = limit;
    }
  }
  return { query, options };
};
export const setProductsLockedForLookupInfoQuery = (taskId) => {
  return {
    $set: {
      info_taskId: `${hostname}:${taskId.toString()}`,
    },
  };
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
        { ean: { $exists: true, $ne: "" } },
        { asin: { $exists: true, $ne: "" } },
      ],
    });
  } else {
    query.$and.push({ asin: { $exists: true, $ne: "" } });
  }

  return query;
};
export const countTotalProductsForLookupInfoQuery = (hasEan) => {
  let query = {};

  if (hasEan) {
    query["ean"] = {
      $exists: true,
      $ne: "",
    };
  } else {
    query["asin"] = {
      $exists: true,
      $ne: "",
    };
  }
  return query;
};
export const lookupInfoTaskQueryFn = (
  lowerThenStartedAt,
  danglingMatchThreshold
) => {
  return [
    { type: "LOOKUP_INFO" },
    {
      $or: [
        { startedAt: { $exists: false } },
        { startedAt: "" },
        {
          startedAt: { $lt: lowerThenStartedAt },
        },
      ],
    },
    { recurrent: { $eq: true } },
    {
      $or: [
        {
          progress: { $exists: false },
        },
        {
          progress: { $elemMatch: { pending: { $gt: 0 } } },
        },
      ],
    },
  ];
};

/*               Queries: Match (3.2) - crawl-data            */

export const lockProductsForMatchQuery = (limit, taskId, action, hasEan) => {
  const options = {};
  let query = {};

  if (action === "recover") {
    query["taskId"] = `${hostname}:${taskId.toString()}`;
  } else {
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
      taskId: `${hostname}:${taskId.toString()}`,
    },
  };
};
export const countPendingProductsForMatchQuery = (hasEan) => {
  let query = {
    $and: [
      { taskId: { $exists: false } },
      { $or: [{ matched: { $exists: false } }, { matched: { $eq: false } }] },
    ],
  };
  if (hasEan) {
    query["$and"].push({ ean: { $exists: true, $ne: "" } });
  }
  return query;
};
export const countTotalProductsForMatchQuery = (hasEan) => {
  let query = {};

  if (hasEan) {
    query["ean"] = {
      $exists: true,
      $ne: "",
    };
  }
  return query;
};
export const matchTaskQueryFn = (
  lowerThenStartedAt,
  danglingMatchThreshold
) => {
  return [
    { type: "MATCH_PRODUCTS" },
    {
      $or: [
        { startedAt: { $exists: false } },
        { startedAt: "" },
        {
          startedAt: { $lt: lowerThenStartedAt },
        },
      ],
    },
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
    query["eby_taskId"] = `${hostname}:${taskId.toString()}`;
  } else {
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
      eby_taskId: `${hostname}:${taskId.toString()}`,
    },
  };
};
export const countPendingProductsQueryEansOnEbyQuery = {
  $and: [
    { eby_taskId: { $exists: false } },
    {
      ean: { $exists: true, $ne: "" },
    },
    {
      $or: [{ eby_prop: { $exists: false } }, { eby_prop: { $eq: "" } }],
    },
  ],
};
export const countTotalProductsForQueryEansOnEbyQuery = {
  ean: { $exists: true, $ne: "" },
};

export const queryEansOnEbyTaskQueryFn = (
  lowerThenStartedAt,
  danglingMatchThreshold
) => {
  return [
    { type: "QUERY_EANS_EBY" },
    {
      $or: [
        { startedAt: { $exists: false } },
        { startedAt: "" },
        {
          startedAt: { $lt: lowerThenStartedAt },
        },
      ],
    },
    { recurrent: { $eq: true } },
    {
      $or: [
        {
          progress: { $exists: false },
        },
        {
          progress: { $elemMatch: { pending: { $gt: 0 } } },
        },
      ],
    },
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
    query["cat_taskId"] = `${hostname}:${taskId.toString()}`;
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
      cat_taskId: `${hostname}:${taskId.toString()}`,
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
export const countTotalProductsForLookupCategoryQuery = {
  eby_prop: { $exists: true, $eq: "complete" },
};
export const lookupCategoryTaskQueryFn = (
  lowerThenStartedAt,
  danglingMatchThreshold
) => {
  return [
    { type: "LOOKUP_CATEGORY" },
    {
      $or: [
        { startedAt: { $exists: false } },
        { startedAt: "" },
        {
          startedAt: { $lt: lowerThenStartedAt },
        },
      ],
    },
    { recurrent: { $eq: true } },
    {
      $or: [
        {
          progress: { $exists: false },
        },
        {
          progress: { $elemMatch: { pending: { $gt: 0 } } },
        },
      ],
    },
  ];
};

/*          Queries: Crawl Azn listings (4.1) - crawl-data               */

export const lockProductsForCrawlAznListingsQuery = (limit, taskId, action) => {
  let query = {};
  let options = {};
  if (action === "recover") {
    query["azn_taskId"] = `${hostname}:${taskId.toString()}`;
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
      azn_taskId: `${hostname}:${taskId.toString()}`,
    },
  };
};
export const countPendingProductsForCrawlAznListingsQuery = () => {
  const query = {
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
    ],
  };
  return query;
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
    ],
  };
};
export const countTotalProductsCrawlAznListingsQuery = {
  asin: { $exists: true, $ne: "" },
};
export const crawlAznListingsTaskQueryFn = (
  lowerThenStartedAt,
  danglingLookupThreshold
) => {
  return [
    { type: "CRAWL_AZN_LISTINGS" },
    {
      $or: [
        { startedAt: { $exists: false } },
        { startedAt: "" },
        {
          startedAt: { $lt: lowerThenStartedAt },
        },
      ],
    },
    { recurrent: { $eq: true } },
  ];
};

/*          Queries: Crawl Eby listings (4.2) - crawl-data              */

export const lockProductsForCrawlEbyListingsQuery = (limit, taskId, action) => {
  let query = {};
  let options = {};
  if (action === "recover") {
    query["eby_taskId"] = `${hostname}:${taskId.toString()}`;
  } else {
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
      eby_taskId: `${hostname}:${taskId.toString()}`,
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
export const crawlEbyListingsTaskQueryFn = (
  lowerThenStartedAt,
  danglingLookupThreshold
) => {
  return [
    { type: "CRAWL_EBY_LISTINGS" },
    {
      $or: [
        { startedAt: { $exists: false } },
        { startedAt: "" },
        {
          startedAt: { $lt: lowerThenStartedAt },
        },
      ],
    },
    { recurrent: { $eq: true } },
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
    { recurrent: { $eq: true } },
    { executing: { $eq: false } },
    {
      $or: [{ completedAt: "" }, { completedAt: { $lt: start } }],
    },
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

  const lowerThenStartedAt =
    process.env.TEST === "endtoend"
      ? oneMinuteAgo.toISOString()
      : fiveMinutesAgo.toISOString();

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

  const crawlEanTaskQuery = crawlEanTaskQueryFn(lowerThenStartedAt); // (2)
  const lookupInfoTaskQuery = lookupInfoTaskQueryFn(lowerThenStartedAt); // (3.1)
  const matchTaskQuery = matchTaskQueryFn(
    // (3.2)
    lowerThenStartedAt,
    danglingMatchThreshold
  );
  const crawlAznListingsTaskQuery = crawlAznListingsTaskQueryFn(
    // (4)
    lowerThenStartedAt,
    danglingLookupThreshold
  );
  const crawlEbyListingsTaskQuery = crawlEbyListingsTaskQueryFn(
    // (4.1)
    lowerThenStartedAt,
    danglingLookupThreshold
  );
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
          {
            $and: [
              ...crawlAznListingsTaskQuery,
              { cooldown: { $lt: new UTCDate().toISOString() } },
            ],
          },
          {
            $and: [
              ...crawlEbyListingsTaskQuery,
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
