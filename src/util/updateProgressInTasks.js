import { getCrawlAznListingsProgress } from "../db/util/crawlAznListings/getCrawlAznListingsProgress.js";
import { getMatchProgress } from "../db/util/match/getMatchProgress.js";
import { getWholesaleSearchProgress } from "../db/util/wholesaleSearch/getWholesaleProgress.js";
import { getMissingEanShops } from "../db/util/crawlEan/getMissingEanShops.js";
import { getUnmatchedEanShops } from "../db/util/lookupInfo/getUnmatchedEanShops.js";
import { getUnmatchedQueryEansOnEbyShops } from "../db/util/queryEansOnEby/getUnmatchedQueryEansOnEbyShops.js";
import { updateTaskWithQuery } from "../db/util/tasks.js";
import { getMissingEbyCategoryShops } from "../db/util/lookupCategory/getMissingEbyCategoryShops.js";
import { getCrawlEbyListingsProgressAggregation } from "../db/util/crawlEbyListings/getCrawlEbyListingsProgressAggregation.js";
import { getOutdatedDealsOnAznShops } from "../db/util/deals/daily/azn/getOutdatedDealsOnAznShops.js";
import { getOutdatedNegMarginAznListingsPerShop } from "../db/util/deals/weekly/azn/getOutdatedNegMarginAznListingsPerShop.js";
import { getOutdatedNegMarginEbyListingsPerShop } from "../db/util/deals/weekly/eby/getOutdatedNegMarginEbyListingsPerShop.js";
import { getOutdatedDealsOnEbyShops } from "../db/util/deals/daily/eby/getOutdatedDealsOnEbyShops.js";

export const updateMatchProgress = async (shopDomain, hasEan) => {
  const progress = await getMatchProgress(shopDomain, hasEan);

  await updateTaskWithQuery(
    { type: "MATCH_PRODUCTS", id: `match_products_${shopDomain}` },
    { progress }
  );
  return progress;
};

export const updateProgressDealsOnAznTasks = async (proxyType) => {
  const { pendingShops: aprogress } = await getOutdatedDealsOnAznShops(
    proxyType
  );
  return await updateTaskWithQuery(
    {
      type: "DEALS_ON_AZN",
      proxyType: proxyType,
    },
    { progress: aprogress }
  );
};

export const updateProgressDealsOnEbyTasks = async (proxyType) => {
  const { pendingShops: eprogress } = await getOutdatedDealsOnEbyShops(
    proxyType
  );
  return await updateTaskWithQuery(
    {
      type: "DEALS_ON_EBY",
      proxyType: proxyType,
    },
    { progress: eprogress }
  );
};

export const updateProgressDealTasks = async (proxyType) => {
  const { pendingShops: aprogress } = await getOutdatedDealsOnAznShops(
    proxyType
  );
  const { pendingShops: eprogress } = await getOutdatedDealsOnEbyShops(
    proxyType
  );
  return await Promise.all([
    await updateTaskWithQuery(
      {
        type: "DEALS_ON_AZN",
        proxyType: proxyType,
      },
      { progress: aprogress }
    ),
    await updateTaskWithQuery(
      {
        type: "DEALS_ON_EBY",
        proxyType: proxyType,
      },
      { progress: eprogress }
    ),
  ]);
};

export const updateProgressNegDealAznTasks = async (proxyType) => {
  const { pendingShops: aprogress } =
    await getOutdatedNegMarginAznListingsPerShop(proxyType);
  return await updateTaskWithQuery(
    {
      type: "CRAWL_AZN_LISTINGS",
      proxyType: proxyType,
    },
    { progress: aprogress }
  );
};

export const updateProgressNegDealEbyTasks = async (proxyType) => {
  const { pendingShops: eprogress } =
    await getOutdatedNegMarginEbyListingsPerShop(proxyType);
  return await updateTaskWithQuery(
    {
      type: "CRAWL_EBY_LISTINGS",
      proxyType: proxyType,
    },
    { progress: eprogress }
  );
};

export const updateProgressNegDealTasks = async (proxyType) => {
  const { pendingShops: aprogress } =
    await getOutdatedNegMarginAznListingsPerShop(proxyType);
  const { pendingShops: eprogress } =
    await getOutdatedNegMarginEbyListingsPerShop(proxyType);
  return await Promise.all([
    await updateTaskWithQuery(
      {
        type: "CRAWL_AZN_LISTINGS",
        proxyType: proxyType,
      },
      { progress: aprogress }
    ),
    await updateTaskWithQuery(
      {
        type: "CRAWL_EBY_LISTINGS",
        proxyType: proxyType,
      },
      { progress: eprogress }
    ),
  ]);
};

export const updateCrawlAznListingsProgress = async (shopDomain) => {
  const progress = await getCrawlAznListingsProgress(shopDomain);

  await updateTaskWithQuery(
    {
      type: "CRAWL_AZN_LISTINGS",
      id: `crawl_azn_listings_${shopDomain}`,
    },
    { progress }
  );
  return progress;
};

export const updateCrawlEbyListingsProgress = async (shopDomain) => {
  const progress = await getCrawlEbyListingsProgressAggregation(shopDomain);

  await updateTaskWithQuery(
    {
      type: "CRAWL_EBY_LISTINGS",
      id: `crawl_eby_listings_${shopDomain}`,
    },
    { progress }
  );
  return progress;
};

export const updateProgressInQueryEansOnEbyTask = async () => {
  const { pendingShops, shops } = await getUnmatchedQueryEansOnEbyShops();
  const progress = pendingShops.reduce((acc, { shop, pending }) => {
    acc.push({
      shop: shop.d,
      pending,
    });
    return acc;
  }, []);
  await updateTaskWithQuery({ id: "query_eans_eby" }, { progress });
  return progress;
};

export const updateProgressInCrawlEanTask = async (proxyType = "mix") => {
  const { pendingShops, shops } = await getMissingEanShops(proxyType);
  const progress = pendingShops.reduce((acc, { shop, pending }) => {
    acc.push({
      shop: shop.d,
      pending,
    });
    return acc;
  }, []);
  await updateTaskWithQuery({ id: "crawl_ean", proxyType }, { progress });
  return progress;
};

export const updateProgressInLookupCategoryTask = async () => {
  const { pendingShops, shops } = await getMissingEbyCategoryShops();
  const progress = pendingShops.reduce((acc, { shop, pending }) => {
    acc.push({
      shop: shop.d,
      pending,
    });
    return acc;
  }, []);
  await updateTaskWithQuery({ id: "lookup_category" }, { progress });
  return progress;
};

export const updateProgressInLookupInfoTask = async () => {
  const { pendingShops, shops } = await getUnmatchedEanShops();
  const progress = pendingShops.reduce((acc, { shop, pending }) => {
    acc.push({
      shop: shop.d,
      pending,
    });
    return acc;
  }, []);
  await updateTaskWithQuery({ id: "lookup_info" }, { progress });
  return progress;
};

export const updateWholesaleProgress = async (taskId) => {
  const progress = await getWholesaleSearchProgress(taskId);

  await updateTaskWithQuery({ _id: taskId }, { progress });
  return progress;
};
