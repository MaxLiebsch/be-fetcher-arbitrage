import { getCrawlerDataDb } from "../mongo.js";

//crawler-data
export const getProductsToMatchCount = async (
  shopProductCollectionName,
  hasEan
) => {
  const twentyFourAgo = new Date();
  twentyFourAgo.setHours(twentyFourAgo.getHours() - 24);
  const db = await getCrawlerDataDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  let query = {
    $and: [
      { matched: false, locked: false },
      {
        $or: [
          { matchedAt: { $exists: false } },
          { matchedAt: { $lte: twentyFourAgo.toISOString() } },
        ],
      },
    ],
  };

  if (hasEan) {
    query.$and.push({ ean: { $exists: true, $ne: "" } });
  }

  return shopProductCollection.count(query);
};

export const getProductCount = async (shopProductCollectionName, hasEan) => {
  const db = await getCrawlerDataDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  let query = {};

  if (hasEan) {
    query["ean"] = {
      $exists: true,
      $ne: "",
    };
  }

  return shopProductCollection.count(query);
};

export const getMatchingProgress = async (shopDomain, hasEan) => {
  const shopProductCollectionName = shopDomain + ".products";
  const pending = await getProductsToMatchCount(
    shopProductCollectionName,
    hasEan
  );
  const total = await getProductCount(shopProductCollectionName, hasEan);

  return {
    percentage: `${(((total - pending) / total) * 100).toFixed(2)} %`,
    pending,
    total,
  };
};
