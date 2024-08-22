import { getArbispotterDb } from "../../mongo.js";
import {
  countCompletedProductsForCrawlAznListingsQuery,
  countPendingProductsForCrawlAznListingsQuery,
  countTotalProductsCrawlAznListingsQuery,
} from "../../util/queries.js";

// arbispotter amazon
export const countTotalProductsCrawlAznListings = async (
  shopProductCollectionName
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.count(countTotalProductsCrawlAznListingsQuery);
};

export const countCompletedProductsForCrawlAznListings = async (
  shopProductCollectionName
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.count(
    countCompletedProductsForCrawlAznListingsQuery
  );
};

export const countPendingProductsForCrawlAznListings = async (
  shopProductCollectionName
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  const query = countPendingProductsForCrawlAznListingsQuery();
  console.log('Query: ', JSON.stringify(query,null,2))
  return shopProductCollection.count(query);
};

export const getCrawlAznListingsProgress = async (shopDomain) => {
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
