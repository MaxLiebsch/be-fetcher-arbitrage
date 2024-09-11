import { getArbispotterDb } from "../../mongo.js";
import {
  countPendingProductsLookupInfoQuery,
  countTotalProductsForLookupInfoQuery,
} from "../../util/queries.js";

// arbispotter amazon
export const countTotalProductsForLookupInfo = async (
  shopProductCollectionName,
  hasEan
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.count(
    countTotalProductsForLookupInfoQuery(hasEan)
  );
};

export const countPendingProductsLookupInfo = async (
  shopProductCollectionName,
  hasEan
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.count(
    countPendingProductsLookupInfoQuery(hasEan)
  );
};

export const getLookupInfoProgress = async (shopDomain, hasEan) => {
  const shopProductCollectionName = shopDomain;
  const pending = await countPendingProductsLookupInfo(
    shopProductCollectionName,
    hasEan
  );
  const total = await countTotalProductsForLookupInfo(
    shopProductCollectionName,
    hasEan
  );

  return {
    percentage: `${(((total - pending) / total) * 100).toFixed(2)} %`,
    pending,
    total,
  };
};
