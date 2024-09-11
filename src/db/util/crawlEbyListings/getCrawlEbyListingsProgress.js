import { getArbispotterDb } from "../../mongo.js";
import {
  countCompletedProductsForCrawlEbyListingsQuery,
  countPendingProductsForCrawlEbyListingsQuery,
  countTotalProductsCrawlEbyListingsQuery,
} from "../../util/queries.js";

// arbispotter amazon
export const countTotalProductsCrawlEbyListings = async (
  shopProductCollectionName
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.count(countTotalProductsCrawlEbyListingsQuery);
};

export const countCompletedProductsForCrawlEbyListings = async (
  shopProductCollectionName
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.count(
    countCompletedProductsForCrawlEbyListingsQuery
  );
};

export const countPendingProductsForCrawlEbyListings = async (
  shopProductCollectionName
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.count(
    countPendingProductsForCrawlEbyListingsQuery()
  );
};

export const getCrawlEbyListingsProgress = async (shopDomain) => {
  const shopProductCollectionName = shopDomain;
  const pending = await countPendingProductsForCrawlEbyListings(
    shopProductCollectionName
  );
  const total = await countTotalProductsCrawlEbyListings(
    shopProductCollectionName
  );
  return {
    percentage: `${(((total - pending) / total) * 100).toFixed(2)} %`,
    pending,
    total,
  };
};
