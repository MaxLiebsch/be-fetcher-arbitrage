import { getArbispotterDb } from "../../../mongo.js";
import {
  countPendingProductsForDealsOnEbyAgg,
  countTotalProductsDealsOnEbyAgg,
} from "../../queries.js";

// arbispotter amazon
export const countTotalProductsDealsOnEby = async (
  shopProductCollectionName
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  const aggregation = countTotalProductsDealsOnEbyAgg;
  return shopProductCollection.aggregate(aggregation).toArray();
};

export const countCompletedProductsForDealsOnEby = async (
  shopProductCollectionName
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  const aggregation = countCompletedProductsForDealsOnEby;
  return shopProductCollection.aggregate(aggregation).toArray();
};

export const countPendingProductsForDealsOnEbyAggregationFn = async (
  shopProductCollectionName
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  const aggregation = countPendingProductsForDealsOnEbyAgg({
    returnTotal: true,
    limit: false,
  });
  return shopProductCollection.aggregate(aggregation).toArray();
};

export const getDealsOnEbyProgressAgg = async (shopDomain) => {
  const shopProductCollectionName = shopDomain;
  const [pending] = await countPendingProductsForDealsOnEbyAggregationFn(
    shopProductCollectionName
  );
  console.log(shopDomain, "pending:", pending);
  const [total] = await countTotalProductsDealsOnEby(shopProductCollectionName);
  return {
    percentage: `${(
      ((total.total - pending.total) / total.total) *
      100
    ).toFixed(2)} %`,
    pending: pending.total,
    total: total.total,
  };
};
