import { getArbispotterDb } from "../../../../mongo.js";
import {
  countCompletedProductsForDealsOnAznQuery,
  countPendingProductsForDealsOnAznQuery,
  countTotalProductsDealsOnAznQuery,
} from "../../../queries.js";

// arbispotter amazon
export const countTotalProductsDealsOnAzn = async (
  shopProductCollectionName: string
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.countDocuments(
    countTotalProductsDealsOnAznQuery
  );
};

export const countCompletedProductsForDealsOnAzn = async (
  shopProductCollectionName: string
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.countDocuments(
    countCompletedProductsForDealsOnAznQuery
  );
};

export const countPendingProductsForDealsOnAzn = async (
  shopProductCollectionName: string
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  const query = countPendingProductsForDealsOnAznQuery();
  return shopProductCollection.countDocuments(query);
};

export const getDealsOnAznProgress = async (shopDomain: string) => {
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
