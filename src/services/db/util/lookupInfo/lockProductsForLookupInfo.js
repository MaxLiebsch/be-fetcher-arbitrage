import { getArbispotterDb } from "../../mongo.js";
import {
  lockProductsForLookupInfoQuery,
  setProductsLockedForLookupInfoQuery,
} from "../../util/queries.js";

export const lockProductsForLookupInfo = async (
  domain,
  limit = 0,
  action,
  taskId,
  hasEan,
) => {
  const collectionName = domain  ;
  const db = await getArbispotterDb();

  const { query, options } = lockProductsForLookupInfoQuery(taskId, limit, action, hasEan);

  const documents = await db
    .collection(collectionName)
    .find(query, options)
    .toArray();

  // Update documents to mark them as locked
  if (action !== "recover") {
    const query = setProductsLockedForLookupInfoQuery(taskId);
    await db
      .collection(collectionName)
      .updateMany({ _id: { $in: documents.map((doc) => doc._id) } }, query);
  }

  return documents;
};
