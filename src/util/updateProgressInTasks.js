import { getCrawlAznListingsProgress } from "../services/db/util/crawlAznListings/getCrawlAznListingsProgress.js";
import { getMatchProgress } from "../services/db/util/match/getMatchProgress.js";
import { getWholesaleSearchProgress } from "../services/db/util/wholesaleSearch/getWholesaleProgress.js";
import { getMissingEanShops } from "../services/db/util/crawlEan/getMissingEanShops.js";
import { getUnmatchedEanShops } from "../services/db/util/lookupInfo/getUnmatchedEanShops.js";
import { getUnmatchedQueryEansOnEbyShops } from "../services/db/util/queryEansOnEby/getUnmatchedQueryEansOnEbyShops.js";
import { updateTaskWithQuery } from "../services/db/util/tasks.js";
import { getMissingEbyCategoryShops } from "../services/db/util/lookupCategory/getMissingEbyCategoryShops.js";
import { getCrawlEbyListingsProgress } from "../services/db/util/crawlEbyListings/getCrawlEbyListingsProgress.js";

export const updateMatchProgress = async (shopDomain, hasEan) => {
  const progress = await getMatchProgress(shopDomain, hasEan);

  await updateTaskWithQuery(
    { type: "MATCH_PRODUCTS", id: `match_products_${shopDomain}` },
    { progress }
  );
  return progress;
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
  const progress = await getCrawlEbyListingsProgress(shopDomain);

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
  const pendingShops = await getUnmatchedQueryEansOnEbyShops();
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
  const pendingShops = await getMissingEanShops(proxyType);
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
  const pendingShops = await getMissingEbyCategoryShops();
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
  const pendingShops = await getUnmatchedEanShops();
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
