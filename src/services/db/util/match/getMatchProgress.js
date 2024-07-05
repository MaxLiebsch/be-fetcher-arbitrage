import { getCrawlDataDb } from "../../mongo.js";
import {
  countTotalProductsForMatchQuery,
  countPendingProductsForMatchQuery,
} from "../../util/queries.js";

export const countPendingProductsForMatch = async (
  shopProductCollectionName,
  hasEan
) => {
  const twentyFourAgo = new Date();
  twentyFourAgo.setHours(twentyFourAgo.getHours() - 24);
  const db = await getCrawlDataDb();
  const shopProductCollection = db.collection(shopProductCollectionName);

  return shopProductCollection.count(countPendingProductsForMatchQuery(hasEan));
};

export const countTotalProductsForMatch = async (
  shopProductCollectionName,
  hasEan
) => {
  const db = await getCrawlDataDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.count(countTotalProductsForMatchQuery(hasEan));
};

export const getMatchProgress = async (shopDomain, hasEan) => {
  const shopProductCollectionName = shopDomain;
  const pending = await countPendingProductsForMatch(
    shopProductCollectionName,
    hasEan
  );
  const total = await countTotalProductsForMatch(
    shopProductCollectionName,
    hasEan
  );

  return {
    percentage: `${(((total - pending) / total) * 100).toFixed(2)} %`,
    pending,
    total,
  };
};
