import { getCrawlDataDb } from "../../mongo.js";
import {
  lockProductsForLookupCategoryQuery,
  setProductsLockedForLookupCategoryQuery,
} from "../../util/queries.js" 

export const lockProductsForLookupCategory = async (
  domain,
  limit = 0,
  action,
  taskId
) => {
  const collectionName = domain;
  const db = await getCrawlDataDb();

  const { query, options } = lockProductsForLookupCategoryQuery(
    taskId,
    limit,
    action
  );

  const documents = await db
    .collection(collectionName)
    .find(query, options)
    .toArray();

  // Update documents to mark them as locked
  if (action !== "recover") {
    const query = setProductsLockedForLookupCategoryQuery(taskId);
    await db
      .collection(collectionName)
      .updateMany({ _id: { $in: documents.map((doc) => doc._id) } }, query);
  }

  return documents;
};
