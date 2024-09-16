import { getArbispotterDb } from "../../mongo.js";
import {
  countTotalProductsForMatchQuery,
  countPendingProductsForMatchQuery,
} from "../queries.js";

export const countPendingProductsForMatch = async (
  shopProductCollectionName: string,
  hasEan: boolean
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);

  return shopProductCollection.countDocuments(
    countPendingProductsForMatchQuery(hasEan)
  );
};

export const countTotalProductsForMatch = async (
  shopProductCollectionName: string,
  hasEan: boolean
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.countDocuments(
    countTotalProductsForMatchQuery(hasEan)
  );
};

export const getMatchProgress = async (shopDomain: string, hasEan: boolean) => {
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
