import { getArbispotterDb } from "../../../../mongo.js";
import {
  countCompletedProductsForCrawlAznListingsQuery,
  countPendingProductsForCrawlAznListingsQuery,
  countTotalProductsCrawlAznListingsQuery,
} from "../../../queries.js";

// arbispotter amazon
export const countTotalProductsCrawlAznListings = async (
  shopProductCollectionName: string
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.countDocuments(
    countTotalProductsCrawlAznListingsQuery
  );
};

export const countCompletedProductsForCrawlAznListings = async (
  shopProductCollectionName: string
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.countDocuments(
    countCompletedProductsForCrawlAznListingsQuery()
  );
};

export const countPendingProductsForCrawlAznListings = async (
  shopProductCollectionName: string
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  const query = countPendingProductsForCrawlAznListingsQuery();
  return shopProductCollection.countDocuments(query);
};

export const getCrawlAznListingsProgress = async (shopDomain: string) => {
  const shopProductCollectionName = shopDomain;
  const pending = await countPendingProductsForCrawlAznListings(
    shopProductCollectionName
  );
  const total = await countTotalProductsCrawlAznListings(
    shopProductCollectionName
  );
  return {
    percentage: `${(((total - pending) / total) * 100).toFixed(2)} %`,
    pending,
    total,
  };
};
