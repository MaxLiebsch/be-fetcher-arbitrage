import { getWholesaleSearchProgress } from "../db/util/wholesaleSearch/getWholesaleProgress.js";
import { updateTaskWithQuery } from "../db/util/tasks.js";
import { MultiStageTaskTypes, TASK_TYPES } from "./taskTypes.js";
import { ObjectId, ProxyType } from "@dipmaxtech/clr-pkg";
import { PendingShops } from "../types/shops.js";
import { findPendingShops } from "../db/util/multiShopUtilities/findPendingShops.js";
import { getTaskProgress } from "../db/util/multiShopUtilities/getTaskProgress.js";
import { findPendingShopsWithAgg } from "../db/util/multiShopUtilities/findPendingShopsWithAgg.js";

export const updateMatchProgress = async (
  shopDomain: string,
  hasEan: boolean
) => {
  const progress = await getTaskProgress(shopDomain, "MATCH_PRODUCTS", hasEan);

  await updateTaskWithQuery(
    { type: TASK_TYPES.MATCH_PRODUCTS, id: `match_products_${shopDomain}` },
    { progress }
  );
  return progress;
};

export const updateProgressDealsOnAznTasks = async (proxyType: ProxyType) => {
  const { pendingShops: aprogress } = await findPendingShops(
    "DEALS_ON_AZN",
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
  const { pendingShops: eprogress } = await findPendingShopsWithAgg(
    "DEALS_ON_EBY",
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
  const { pendingShops: aprogress } = await findPendingShops(
    "DEALS_ON_AZN",
    proxyType
  );
  const { pendingShops: eprogress } = await findPendingShopsWithAgg(
    "DEALS_ON_EBY",
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
  const { pendingShops: aprogress } = await findPendingShops(
    "NEG_AZN_DEALS",
    proxyType
  );
  return await updateTaskWithQuery(
    {
      type: TASK_TYPES.NEG_AZN_DEALS,
      proxyType: proxyType,
    },
    { progress: aprogress }
  );
};

export const updateProgressNegDealEbyTasks = async (proxyType: ProxyType) => {
  const { pendingShops: eprogress } = await findPendingShopsWithAgg(
    "NEG_EBY_DEALS",
    proxyType
  );
  return await updateTaskWithQuery(
    {
      type: TASK_TYPES.NEG_EBY_DEALS,
      proxyType: proxyType,
    },
    { progress: eprogress }
  );
};

export const updateProgressNegDealTasks = async (proxyType: ProxyType) => {
  const { pendingShops: aprogress } = await findPendingShops(
    "NEG_AZN_DEALS",
    proxyType
  );
  const { pendingShops: eprogress } = await findPendingShopsWithAgg(
    "NEG_EBY_DEALS",
    proxyType
  );
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

export const updateProgressInQueryEansOnEbyTask = async () => {
  const { pendingShops, shops } = await findPendingShops("QUERY_EANS_EBY");
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
  const { pendingShops, shops } = await findPendingShops(
    "CRAWL_EAN",
    proxyType
  );
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
  const { pendingShops, shops } = await findPendingShops("LOOKUP_CATEGORY");
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
  const { pendingShops, shops } = await findPendingShops("LOOKUP_INFO");
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

export const updateWholesaleProgress = async (
  taskId: ObjectId,
  taskType: MultiStageTaskTypes
) => {
  const progress = await getWholesaleSearchProgress(taskId, taskType);

  await updateTaskWithQuery({ _id: taskId }, { progress });
  return progress;
};
