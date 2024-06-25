import { getCrawlerDataDb } from "../mongo.js";
import { countPendingProductsLookupInfoQuery, countTotalProductsForLookupInfoQuery } from "./queries.js";

// arbispotter amazon
export const countTotalProductsForLookupInfo = async (shopProductCollectionName) => {
  const db = await getCrawlerDataDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.count(countTotalProductsForLookupInfoQuery);
};

export const countPendingProductsLookupInfo = async (
  shopProductCollectionName
) => {
  const db = await getCrawlerDataDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.count(countPendingProductsLookupInfoQuery);
};

export const getLookupInfoProgress = async (shopDomain) => {
  const shopProductCollectionName = shopDomain + ".products";
  const pending = await countPendingProductsLookupInfo(
    shopProductCollectionName
  );
  const total = await countTotalProductsForLookupInfo(shopProductCollectionName);

  return {
    percentage: `${(((total - pending) / total) * 100).toFixed(2)} %`,
    pending,
    total,
  };
};
