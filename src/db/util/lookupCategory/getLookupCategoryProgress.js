import { getArbispotterDb } from "../../mongo.js";
import {
  countPendingProductsForLookupCategoryQuery,
  countTotalProductsForLookupCategoryQuery,
} from "../../util/queries.js";

export const countTotalProductsForLookupCategory = async (
  shopProductCollectionName
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.count(countTotalProductsForLookupCategoryQuery);
};

export const countPendingProductsForLookupCategory = async (
  shopProductCollectionName
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.count(
    countPendingProductsForLookupCategoryQuery
  );
};

export const getLookupCategoryProgress = async (shopDomain) => {
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
