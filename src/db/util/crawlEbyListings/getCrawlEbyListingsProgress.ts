import { getArbispotterDb } from "../../mongo.js";
import {
  countCompletedProductsForCrawlEbyListingsQuery,
  countPendingProductsForCrawlEbyListingsQuery,
  countTotalProductsCrawlEbyListingsQuery,
} from "../../util/queries.js";

// arbispotter amazon
export const countTotalProductsCrawlEbyListings = async (
  shopProductCollectionName: string
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.countDocuments(
    countTotalProductsCrawlEbyListingsQuery
  );
};

export const countCompletedProductsForCrawlEbyListings = async (
  shopProductCollectionName: string
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.countDocuments(
    countCompletedProductsForCrawlEbyListingsQuery
  );
};

export const countPendingProductsForCrawlEbyListings = async (
  shopProductCollectionName: string
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.countDocuments(
    countPendingProductsForCrawlEbyListingsQuery()
  );
};

export const getCrawlEbyListingsProgress = async (shopDomain: string) => {
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
