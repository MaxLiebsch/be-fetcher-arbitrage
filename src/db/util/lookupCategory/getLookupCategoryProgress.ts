import { getArbispotterDb } from "../../mongo.js";
import {
  countPendingProductsForLookupCategoryQuery,
  countTotalProductsForLookupCategoryQuery,
} from "../queries.js";

export const countTotalProductsForLookupCategory = async (
  shopProductCollectionName: string
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.countDocuments(
    countTotalProductsForLookupCategoryQuery
  );
};

export const countPendingProductsForLookupCategory = async (
  shopProductCollectionName: string
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.countDocuments(
    countPendingProductsForLookupCategoryQuery
  );
};

export const getLookupCategoryProgress = async (shopDomain: string) => {
  const shopProductCollectionName = shopDomain;
  const pending = await countPendingProductsForLookupCategory(
    shopProductCollectionName
  );
  const total = await countTotalProductsForLookupCategory(
    shopProductCollectionName
  );

  return {
    percentage: `${(((total - pending) / total) * 100).toFixed(2)} %`,
    pending,
    total,
  };
};
