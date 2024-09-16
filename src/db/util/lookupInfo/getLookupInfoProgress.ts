import { getArbispotterDb } from "../../mongo.js";
import {
  countPendingProductsLookupInfoQuery,
  countTotalProductsForLookupInfoQuery,
} from "../queries.js";

// arbispotter amazon
export const countTotalProductsForLookupInfo = async (
  shopProductCollectionName: string,
  hasEan: boolean
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.countDocuments(
    countTotalProductsForLookupInfoQuery(hasEan)
  );
};

export const countPendingProductsLookupInfo = async (
  shopProductCollectionName: string,
  hasEan: boolean
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.countDocuments(
    countPendingProductsLookupInfoQuery(hasEan)
  );
};

export const getLookupInfoProgress = async (
  shopDomain: string,
  hasEan: boolean
) => {
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
