import { startOfDay } from "date-fns";
import { subDateDaysISO } from "../../../util/dates.js";
import { hostname } from "../mongo.js";
import {
  DANGLING_LOOKUP_THRESHOLD,
  DANGLING_MATCH_THRESHOLD,
  MAX_EARNING_MARGIN,
} from "../../../constants.js";
// a_origin setzen when infos ueber lookup ean

/*
1.  Crawl Shop
2.  Crawl Eans       
  - Herkunftsean von Sourc shop
3.1 Lookup Info  
  - sellerinformation(name, link, image, asin, buyBoxIsAmazon, costs, sellerRank), calculate marge
3.2 Match           
  - shop has no ean, match amazon,ebay, else ebay  
4.  Crawl Azn Listings
  - crawl amazon listings

System of dependencies:
  - crawl ean depends on crawl shop (updated in crawl fn after crawl shop)
  - match and lookup Info depends on crawl ean (updated in crawl ean fn after crawl ean)
  - aznListings depends on match (updated in match fn after match)
  - each task (excl. crawl) should update it's own progress in the beginning and end of the task
*/

/*               Queries Crawl (1)                            */

export const crawlShopTaskQueryFn = (start, weekday) => {
  return [
    { type: "CRAWL_SHOP" },
    { recurrent: { $eq: true } },
    { executing: { $eq: false } },
    { weekday: { $eq: weekday } },
    {
      $or: [{ completedAt: "" }, { completedAt: { $lt: start.toISOString() } }],
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
    query["$or"] = [
      { ean_locked: { $exists: false } },
      { ean_locked: { $exists: true, $eq: false } },
    ];
    query["$or"] = [
      { ean: { $exists: false } },
      { ean: { $exists: true, $eq: "" } },
    ];
    query["ean_prop"] = { $exists: false };

    if (limit) {
      options["limit"] = limit;
    }
  }
  return { query, options };
};
export const setProductsLockedForCrawlEanQuery = (taskId) => {
  return {
    $set: {
      ean_locked: true,
      ean_taskId: `${hostname}:${taskId.toString()}`,
    },
  };
};
export const countPendingProductsForCrawlEanQuery = {
  $and: [
    {
      $or: [{ ean_locked: { $exists: false } }, { ean_locked: { $eq: false } }],
    },
    {
      $or: [{ ean: { $exists: false } }, { ean: { $exists: true, $eq: "" } }],
    },
    {
      ean_prop: { $exists: false },
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

export const lockProductsForLookupInfoQuery = (taskId, limit, action) => {
  let query = {};
  let options = {};

  if (action === "recover") {
    query["info_taskId"] = `${hostname}:${taskId.toString()}`;
  } else {
    query["$or"] = [
      { info_looked: { $exists: false } },
      { info_looked: { $exists: true, $eq: false } },
    ];
    query["info_prop"] = { $exists: false };
    query["ean"] = { $exists: true, $ne: "" };
    if (limit) {
      options["limit"] = limit;
    }
  }
  return { query, options };
};
export const setProductsLockedForLookupInfoQuery = (taskId) => {
  return {
    $set: {
      info_locked: true,
      info_taskId: `${hostname}:${taskId.toString()}`,
    },
  };
};
export const countPendingProductsLookupInfoQuery = {
  $and: [
    {
      $or: [
        { info_locked: { $exists: false } },
        { info_locked: { $eq: false } },
      ],
    },
    {
      ean: { $exists: true, $ne: "" },
    },
    {
      $or: [{ info_prop: { $exists: false } }, { info_prop: { $eq: "" } }],
    },
  ],
};
export const countTotalProductsForLookupInfoQuery = {};

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
  const query = {};

  if (action === "recover") {
    query["taskId"] = `${hostname}:${taskId.toString()}`;
  } else {
    query["locked"] = { $exists: true, $eq: false };
    query["matched"] = { $exists: true, $eq: false };
    if (hasEan) query["ean"] = { $exists: true, $ne: "" };
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
      taskId: `${hostname}:${taskId.toString()}`,
    },
  };
};
export const countPendingProductsForMatchQuery = (hasEan) => {
  const twentyFourAgo = new Date();
  twentyFourAgo.setHours(twentyFourAgo.getHours() - 24);
  let query = {
    $and: [
      { matched: false, locked: false },
      {
        $or: [
          { matchedAt: { $exists: false } },
          { matchedAt: { $lte: twentyFourAgo.toISOString() } },
        ],
      },
    ],
  };

  if (hasEan) {
    query.$and.push({ ean: { $exists: true, $ne: "" } });
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

/*          Queries: Crawl Azn listings (4) - arbispotterdb          */

export const lockProductsForCrawlAznListingsQuery = (limit, taskId, action) => {
  let query = {};
  let options = {};
  if (action === "recover") {
    query["taskId"] = `${hostname}:${taskId.toString()}`;
  } else {
    query = {
      $and: [
        {
          $or: [{ lckd: { $exists: false } }, { lckd: { $eq: false } }],
        },
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
  }

  if (limit && action !== "recover") {
    options["limit"] = limit;
  }
  return { options, query };
};
export const setProductsLockedForCrawlAznListingsQuery = (taskId) => {
  return {
    $set: {
      lckd: true,
      taskId: `${hostname}:${taskId.toString()}`,
    },
  };
};
export const countPendingProductsForCrawlAzinListingsQuery = () => {
  return {
    $and: [
      {
        lckd: false,
      },
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
};
export const countCompletedProductsForCrawlAzinListingsQuery = () => {
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
    {
      $or: [
        {
          progress: { $exists: false },
        },
        { "progress.pending": { $gt: danglingLookupThreshold } },
      ],
    },
  ];
};

/*               Queries: Scan                                 */

const scanTaskQuery = [
  { type: "SCAN_SHOP" },
  { recurrent: { $eq: false } },
  { completed: { $eq: false } },
  { executing: { $eq: false } },
];

/*               Queries: Wholesale                            */

const wholesaleTaskQuery = [
  { type: "WHOLESALE_SEARCH" },
  { "progress.pending": { $gt: 0 } },
];

/*               Queries: Tasks                                */

export const findTasksQuery = () => {
  const today = new Date();

  const fiveMinutesAgo = new Date();
  fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

  const oneMinuteAgo = new Date();
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

  const start = startOfDay(today);

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

  const crawlShopTaskQuery = crawlShopTaskQueryFn(start, weekday); // (1)
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

  const query = {
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
            $and: [
              ...crawlEanTaskQuery,
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
              ...matchTaskQuery,
              { cooldown: { $lt: new Date().toISOString() } },
            ],
          },
          {
            $and: [
              ...crawlAznListingsTaskQuery,
              { cooldown: { $lt: new Date().toISOString() } },
            ],
          },
          {
            $and: scanTaskQuery,
          },
          {
            $and: wholesaleTaskQuery,
          },
        ],
      },
    ],
  };

  return {
    query,
    update,
    danglingMatchThreshold,
    danglingLookupThreshold,
    lookupInfoTaskQuery,
    matchTaskQuery,
    crawlAznListingsTaskQuery,
    crawlEanTaskQuery,
  };
};
