import { getArbispotterDb } from "../../../../mongo.js";
import {
  countCompletedProductsForCrawlEbyListingsAggregation,
  countPendingProductsForCrawlEbyListingsAggregation,
  countTotalProductsCrawlEbyListingsAggregation,
} from "../../../queries.js";

// arbispotter amazon
export const countTotalProductsCrawlEbyListings = async (
  shopProductCollectionName: string
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  const aggregation = countTotalProductsCrawlEbyListingsAggregation;
  return shopProductCollection.aggregate(aggregation).toArray();
};

export const countCompletedProductsForCrawlEbyListings = async (
  shopProductCollectionName: string
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  const aggregation = countCompletedProductsForCrawlEbyListingsAggregation;
  return shopProductCollection.aggregate(aggregation).toArray();
};

export const countPendingProductsForCrawlEbyListingsAggregationFn = async (
  shopProductCollectionName: string
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  const aggregation = countPendingProductsForCrawlEbyListingsAggregation({
    returnTotal: true,
    limit: 0,
  });
  return shopProductCollection.aggregate(aggregation).toArray();
};

export const getNegMarginEbyListingsProgressAggregation = async (
  shopDomain: string
) => {
  const shopProductCollectionName = shopDomain;
  const [pending] = await countPendingProductsForCrawlEbyListingsAggregationFn(
    shopProductCollectionName
  );
  const [total] = await countTotalProductsCrawlEbyListings(
    shopProductCollectionName
  );

  if (!total || !pending) {
    return {
      percentage: "0 %",
      pending: 0,
      total: 0,
    };
  }
  return {
    percentage: `${(
      ((total.total - pending.total) / total.total) *
      100
    ).toFixed(2)} %`,
    pending: pending.total,
    total: total.total,
  };
};
