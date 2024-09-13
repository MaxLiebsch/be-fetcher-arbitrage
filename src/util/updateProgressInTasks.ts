import { getCrawlAznListingsProgress } from "../db/util/crawlAznListings/getCrawlAznListingsProgress";
import { getMatchProgress } from "../db/util/match/getMatchProgress";
import { getWholesaleSearchProgress } from "../db/util/wholesaleSearch/getWholesaleProgress";
import { getMissingEanShops } from "../db/util/crawlEan/getMissingEanShops";
import { getUnmatchedEanShops } from "../db/util/lookupInfo/getUnmatchedEanShops";
import { getUnmatchedQueryEansOnEbyShops } from "../db/util/queryEansOnEby/getUnmatchedQueryEansOnEbyShops";
import { updateTaskWithQuery } from "../db/util/tasks";
import { getMissingEbyCategoryShops } from "../db/util/lookupCategory/getMissingEbyCategoryShops";
import { getCrawlEbyListingsProgressAggregation } from "../db/util/crawlEbyListings/getCrawlEbyListingsProgressAggregation";
import { getOutdatedDealsOnAznShops } from "../db/util/deals/daily/azn/getOutdatedDealsOnAznShops";
import { getOutdatedNegMarginAznListingsPerShop } from "../db/util/deals/weekly/azn/getOutdatedNegMarginAznListingsPerShop";
import { getOutdatedNegMarginEbyListingsPerShop } from "../db/util/deals/weekly/eby/getOutdatedNegMarginEbyListingsPerShop";
import { getOutdatedDealsOnEbyShops } from "../db/util/deals/daily/eby/getOutdatedDealsOnEbyShops";
import { TASK_TYPES } from "./taskTypes";
import { ObjectId, ProxyType } from "@dipmaxtech/clr-pkg";
import { PendingShops } from "../types/shops";

export const updateMatchProgress = async (
  shopDomain: string,
  hasEan: boolean
) => {
  const progress = await getMatchProgress(shopDomain, hasEan);

  await updateTaskWithQuery(
    { type: TASK_TYPES.MATCH_PRODUCTS, id: `match_products_${shopDomain}` },
    { progress }
  );
  return progress;
};

export const updateProgressDealsOnAznTasks = async (proxyType: ProxyType) => {
  const { pendingShops: aprogress } = await getOutdatedDealsOnAznShops(
    proxyType
  );
  return await updateTaskWithQuery(
    {
      type: TASK_TYPES.DEALS_ON_AZN,
      proxyType: proxyType,
    },
    { progress: aprogress }
  );
};

export const updateProgressDealsOnEbyTasks = async (proxyType: ProxyType) => {
  const { pendingShops: eprogress } = await getOutdatedDealsOnEbyShops(
    proxyType
  );
  return await updateTaskWithQuery(
    {
      type: TASK_TYPES.DEALS_ON_EBY,
      proxyType: proxyType,
    },
    { progress: eprogress }
  );
};

export const updateProgressDealTasks = async (proxyType: ProxyType) => {
  const { pendingShops: aprogress } = await getOutdatedDealsOnAznShops(
    proxyType
  );
  const { pendingShops: eprogress } = await getOutdatedDealsOnEbyShops(
    proxyType
  );
  return await Promise.all([
    await updateTaskWithQuery(
      {
        type: TASK_TYPES.DEALS_ON_AZN,
        proxyType: proxyType,
      },
      { progress: aprogress }
    ),
    await updateTaskWithQuery(
      {
        type: TASK_TYPES.DEALS_ON_EBY,
        proxyType: proxyType,
      },
      { progress: eprogress }
    ),
  ]);
};

export const updateProgressNegDealAznTasks = async (proxyType: ProxyType) => {
  const { pendingShops: aprogress } =
    await getOutdatedNegMarginAznListingsPerShop(proxyType);
  return await updateTaskWithQuery(
    {
      type: TASK_TYPES.NEG_AZN_DEALS,
      proxyType: proxyType,
    },
    { progress: aprogress }
  );
};

export const updateProgressNegDealEbyTasks = async (proxyType: ProxyType) => {
  const { pendingShops: eprogress } =
    await getOutdatedNegMarginEbyListingsPerShop(proxyType);
  return await updateTaskWithQuery(
    {
      type: TASK_TYPES.NEG_EBY_DEALS,
      proxyType: proxyType,
    },
    { progress: eprogress }
  );
};

export const updateProgressNegDealTasks = async (proxyType: ProxyType) => {
  const { pendingShops: aprogress } =
    await getOutdatedNegMarginAznListingsPerShop(proxyType);
  const { pendingShops: eprogress } =
    await getOutdatedNegMarginEbyListingsPerShop(proxyType);
  return await Promise.all([
    await updateTaskWithQuery(
      {
        type: TASK_TYPES.NEG_AZN_DEALS,
        proxyType: proxyType,
      },
      { progress: aprogress }
    ),
    await updateTaskWithQuery(
      {
        type: TASK_TYPES.NEG_EBY_DEALS,
        proxyType: proxyType,
      },
      { progress: eprogress }
    ),
  ]);
};

export const updateCrawlAznListingsProgress = async (shopDomain: string) => {
  const progress = await getCrawlAznListingsProgress(shopDomain);

  await updateTaskWithQuery(
    {
      type: TASK_TYPES.NEG_AZN_DEALS,
      id: `crawl_azn_listings_${shopDomain}`,
    },
    { progress }
  );
  return progress;
};

export const updateCrawlEbyListingsProgress = async (shopDomain: string) => {
  const progress = await getCrawlEbyListingsProgressAggregation(shopDomain);

  await updateTaskWithQuery(
    {
      type: TASK_TYPES.NEG_EBY_DEALS,
      id: `crawl_eby_listings_${shopDomain}`,
    },
    { progress }
  );
  return progress;
};

export const updateProgressInQueryEansOnEbyTask = async () => {
  const { pendingShops, shops } = await getUnmatchedQueryEansOnEbyShops();
  const progress = pendingShops.reduce<PendingShops>(
    (acc, { shop, pending }) => {
      acc.push({
        shop,
        pending,
      });
      return acc;
    },
    []
  );
  await updateTaskWithQuery({ id: "query_eans_eby" }, { progress });
  return progress;
};

export const updateProgressInCrawlEanTask = async (proxyType: ProxyType) => {
  const { pendingShops, shops } = await getMissingEanShops(proxyType);
  const progress = pendingShops.reduce<PendingShops>(
    (acc, { shop, pending }) => {
      acc.push({
        shop,
        pending,
      });
      return acc;
    },
    []
  );
  await updateTaskWithQuery({ id: "crawl_ean", proxyType }, { progress });
  return progress;
};

export const updateProgressInLookupCategoryTask = async () => {
  const { pendingShops, shops } = await getMissingEbyCategoryShops();
  const progress = pendingShops.reduce<PendingShops>(
    (acc, { shop, pending }) => {
      acc.push({
        shop,
        pending,
      });
      return acc;
    },
    []
  );
  await updateTaskWithQuery({ id: "lookup_category" }, { progress });
  return progress;
};

export const updateProgressInLookupInfoTask = async () => {
  const { pendingShops, shops } = await getUnmatchedEanShops();
  const progress = pendingShops.reduce<PendingShops>(
    (acc, { shop, pending }) => {
      acc.push({
        shop,
        pending,
      });
      return acc;
    },
    []
  );
  await updateTaskWithQuery({ id: "lookup_info" }, { progress });
  return progress;
};

export const updateWholesaleProgress = async (taskId: ObjectId) => {
  const progress = await getWholesaleSearchProgress(taskId);

  await updateTaskWithQuery({ _id: taskId }, { progress });
  return progress;
};
