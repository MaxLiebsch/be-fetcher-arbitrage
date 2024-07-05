import { getCrawlDataDb } from "../../mongo.js";
import { countPendingProductsQueryEansOnEbyQuery, countTotalProductsForQueryEansOnEbyQuery } from "../../util/queries.js";

// arbispotter amazon
export const countTotalProductsForQueryEansOnEby = async (shopProductCollectionName) => {
  const db = await getCrawlDataDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.count(countTotalProductsForQueryEansOnEbyQuery);
};

export const countPendingProductsQueryEansOnEby = async (
  shopProductCollectionName
) => {
  const db = await getCrawlDataDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return shopProductCollection.count(countPendingProductsQueryEansOnEbyQuery);
};

export const getQueryEansOnEbyProgress = async (shopDomain) => {
  const shopProductCollectionName = shopDomain  ;
  const pending = await countPendingProductsQueryEansOnEby(
    shopProductCollectionName
  );
  const total = await countTotalProductsForQueryEansOnEby(shopProductCollectionName);

  return {
    percentage: `${(((total - pending) / total) * 100).toFixed(2)} %`,
    pending,
    total,
  };
};
