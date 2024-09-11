import { getArbispotterDb } from "../../mongo.js";
import {
  countTotalProductsForMatchQuery,
  countPendingProductsForMatchQuery,
} from "../../util/queries.js";

export const countPendingProductsForMatch = async (
  shopProductCollectionName,
  hasEan
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);

  return shopProductCollection.count(countPendingProductsForMatchQuery(hasEan));
};

export const countTotalProductsForMatch = async (
  shopProductCollectionName,
  hasEan
) => {
  const db = await getArbispotterDb();
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
