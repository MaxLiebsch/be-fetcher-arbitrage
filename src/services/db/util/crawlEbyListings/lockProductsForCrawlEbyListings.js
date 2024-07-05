import { getCrawlDataDb } from "../../mongo.js";
import {
  lockProductsForCrawlEbyListingsQuery,
  setProductsLockedForCrawlEbyListingsQuery,
} from "../queries.js";

export const lockProductsForCrawlEbyListings = async (
  domain,
  limit = 0,
  taskId,
  action
) => {
  const collectionName = domain;
  const db = await getCrawlDataDb();

  const { query, options } = lockProductsForCrawlEbyListingsQuery(
    limit,
    taskId,
    action
  );

  const documents = await db
    .collection(collectionName)
    .find(query, options)
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
