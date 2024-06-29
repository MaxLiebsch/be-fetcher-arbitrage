import { getCrawlDataDb } from "../mongo.js";
import {
  lockProductsForCrawlEanQuery,
  setProductsLockedForCrawlEanQuery,
} from "./queries.js";

export const lockProductsForCrawlEan = async (
  domain,
  limit = 0,
  action,
  taskId
) => {
  const collectionName = domain  ;
  const db = await getCrawlDataDb();

  const { query, options } = lockProductsForCrawlEanQuery(taskId, limit, action);

  const documents = await db
    .collection(collectionName)
    .find(query, options)
    .toArray();

  // Update documents to mark them as locked
  if (action !== "recover") {
    const query = setProductsLockedForCrawlEanQuery(taskId);
    await db
      .collection(collectionName)
      .updateMany({ _id: { $in: documents.map((doc) => doc._id) } }, query);
  }

  return documents;
};
