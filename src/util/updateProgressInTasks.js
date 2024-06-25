import { getCrawlAznListingsProgress } from "../services/db/util/getCrawlAznListingsProgress.js";
import { getLookupInfoProgress } from "../services/db/util/getLookupInfoProgress.js";
import { getMatchProgress } from "../services/db/util/getMatchProgress.js";
import { getWholesaleProgress } from "../services/db/util/getWholesaleProgress.js";
import { findMissingEanShops } from "../services/db/util/lookForMissingEans.js";
import { getUnmatchecEanShops } from "../services/db/util/lookForUnmatchedEans.js";
import { updateTaskWithQuery } from "../services/db/util/tasks.js";

export const updateLookupInfoProgress = async (shopDomain) => {
  const progress = await getLookupInfoProgress(shopDomain);
  if (progress)
    await updateTaskWithQuery(
      {
        type: "CRAWL_AZN_LISTINGS",
        id: `crawl_azn_listings_${shopDomain}`,
      },
      { progress }
    );
};

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

export const updateProgressInCrawlEanTask = async (proxyType = "mix") => {
  const pendingShops = await findMissingEanShops(proxyType);
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

export const updateProgressInLookupInfoTask = async () => {
  const pendingShops = await getUnmatchecEanShops();
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

export const updateWholesaleProgress = async (taskId, total) => {
  const progress = await getWholesaleProgress(taskId, total);

  await updateTaskWithQuery({ _id }, { progress });
  return progress;
};
