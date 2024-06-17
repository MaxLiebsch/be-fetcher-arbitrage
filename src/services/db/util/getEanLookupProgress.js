import { getCrawlerDataDb } from "../mongo.js";
import { pendingEanLookupProductsQuery } from "./queries.js";

// arbispotter amazon
export const getProductCount = async (shopProductCollectionName) => {
  const db = await getCrawlerDataDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.count({});
};

export const getProductsToUpdateEanLookupCount = async (
  shopProductCollectionName
) => {
  const db = await getCrawlerDataDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.count(pendingEanLookupProductsQuery);
};

export const getEanLookupProgress = async (shopDomain) => {
  const shopProductCollectionName = shopDomain + ".products";
  const pending = await getProductsToUpdateEanLookupCount(
    shopProductCollectionName
  );
  const total = await getProductCount(shopProductCollectionName);

  return {
    percentage: `${(((total - pending) / total) * 100).toFixed(2)} %`,
    pending,
    total,
  };
};
