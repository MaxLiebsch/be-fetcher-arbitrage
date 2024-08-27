import { getArbispotterDb } from "../../../../mongo.js";
import {
  countCompletedProductsForDealsOnAznQuery,
  countPendingProductsForDealsOnAznQuery,
  countTotalProductsDealsOnAznQuery,
} from "../../../queries.js";

// arbispotter amazon
export const countTotalProductsDealsOnAzn = async (
  shopProductCollectionName
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.count(countTotalProductsDealsOnAznQuery);
};

export const countCompletedProductsForDealsOnAzn = async (
  shopProductCollectionName
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.count(countCompletedProductsForDealsOnAznQuery);
};

export const countPendingProductsForDealsOnAzn = async (
  shopProductCollectionName
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  const query = countPendingProductsForDealsOnAznQuery();
  return shopProductCollection.count(query);
};

export const getDealsOnAznProgress = async (shopDomain) => {
  const shopProductCollectionName = shopDomain;
  const pending = await countPendingProductsForDealsOnAzn(
    shopProductCollectionName
  );
  const total = await countTotalProductsDealsOnAzn(shopProductCollectionName);
  return {
    percentage: `${(((total - pending) / total) * 100).toFixed(2)} %`,
    pending,
    total,
  };
};
