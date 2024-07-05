import { getCrawlDataDb } from "../../mongo.js";
import { countPendingProductsForCrawlEanQuery, countTotalProductsForCrawlEanQuery } from "../queries.js";

export const countTotalProductsForCrawlEan = async (shopProductCollectionName) => {
  const db = await getCrawlDataDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.count(countTotalProductsForCrawlEanQuery);
};

export const countPendingProductsForCrawlEan = async (
  shopProductCollectionName
) => {
  const db = await getCrawlDataDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.count(countPendingProductsForCrawlEanQuery);
};

export const getCrawlEanProgress = async (shopDomain) => {
  const shopProductCollectionName = shopDomain  ;
  const pending = await countPendingProductsForCrawlEan(
    shopProductCollectionName
  );
  const total = await countTotalProductsForCrawlEan(shopProductCollectionName);

  return {
    percentage: `${(((total - pending) / total) * 100).toFixed(2)} %`,
    pending,
    total,
  };
};
