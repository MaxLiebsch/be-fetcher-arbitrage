import { getArbispotterDb } from "../../mongo.js";
import {
  countPendingProductsQueryEansOnEbyQuery,
  countTotalProductsForQueryEansOnEbyQuery,
} from "../queries.js";

// arbispotter amazon
export const countTotalProductsForQueryEansOnEby = async (
  shopProductCollectionName: string
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.countDocuments(
    countTotalProductsForQueryEansOnEbyQuery
  );
};

export const countPendingProductsQueryEansOnEby = async (
  shopProductCollectionName: string
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.countDocuments(
    countPendingProductsQueryEansOnEbyQuery
  );
};

export const getQueryEansOnEbyProgress = async (shopDomain: string) => {
  const shopProductCollectionName = shopDomain;
  const pending = await countPendingProductsQueryEansOnEby(
    shopProductCollectionName
  );
  const total = await countTotalProductsForQueryEansOnEby(
    shopProductCollectionName
  );

  return {
    percentage: `${(((total - pending) / total) * 100).toFixed(2)} %`,
    pending,
    total,
  };
};
