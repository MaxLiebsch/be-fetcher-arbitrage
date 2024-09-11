import { getArbispotterDb } from "../../mongo.js";
import {
  countCompletedProductsUpdateProductinfoAgg,
  countPendingProductsUpdateProductinfoAgg,
  countTotalProductsForUpdateProductinfoAgg,
} from "../queries.js";

// arbispotter amazon
export const countTotalProductsForUpdateProductinfo = async (
  shopProductCollectionName
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  const agg = countTotalProductsForUpdateProductinfoAgg;
  return shopProductCollection.aggregate(agg).toArray();
};

export const countCompletedProductsForUpdateProductinfo = async (
  shopProductCollectionName
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  const agg = countCompletedProductsUpdateProductinfoAgg;
  return await shopProductCollection.aggregate(agg).toArray();
};

export const countPendingProductsUpdateProductinfo = async (
  shopProductCollectionName
) => {
  const db = await getArbispotterDb();
  const shopProductCollection = db.collection(shopProductCollectionName);
  return await shopProductCollection
    .aggregate(countPendingProductsUpdateProductinfoAgg)
    .toArray();
};

export const getUpdateProductinfoProgress = async (shopDomain) => {
  const shopProductCollectionName = shopDomain;
  const [pendingTargets] = await countPendingProductsUpdateProductinfo(
    shopProductCollectionName
  );
  const [totalTargets] = await countTotalProductsForUpdateProductinfo(
    shopProductCollectionName
  );
  const ebay = {
    pending: pendingTargets.ebay[0].total,
    total: totalTargets.ebay[0].total,
  };

  const amazon = {
    pending: pendingTargets.amazon[0].total,
    total: totalTargets.amazon[0].total,
  };

  return {
    ebay: {
      percentage: `${(((ebay.total - ebay.pending) / ebay.total) * 100).toFixed(
        2
      )} %`,
      pending: ebay.pending,
      total: ebay.total,
    },
    amazon: {
      percentage: `${(
        ((amazon.total - amazon.pending) / amazon.total) *
        100
      ).toFixed(2)} %`,
      pending: amazon.pending,
      total: amazon.total,
    },
  };
};
