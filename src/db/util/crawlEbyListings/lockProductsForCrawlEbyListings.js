import { getArbispotterDb } from "../../mongo.js";
import {
  lockProductsForCrawlEbyListingsAggregation,
  setProductsLockedForCrawlEbyListingsQuery,
} from "../queries.js";

export const lockProductsForCrawlEbyListings = async (
  domain,
  limit = 0,
  taskId,
  action
) => {
  const collectionName = domain;
  const db = await getArbispotterDb();

  const agg = lockProductsForCrawlEbyListingsAggregation(limit, taskId, action);

  const documents = await db
    .collection(collectionName)
    .aggregate(agg)
    .toArray();

  // Update documents to mark them as locked
  if (action !== "recover") {
    const query = setProductsLockedForCrawlEbyListingsQuery(taskId);
    await db
      .collection(collectionName)
      .updateMany({ _id: { $in: documents.map((doc) => doc._id) } }, query);
  }

  return documents;
};
