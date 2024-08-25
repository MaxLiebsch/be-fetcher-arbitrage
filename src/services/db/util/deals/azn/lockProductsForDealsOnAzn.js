import { getArbispotterDb } from "../../../mongo.js";
import {
  lockProductsForDealsOnAznQuery,
  setProductsLockedForDealsOnAznQuery,
} from "../../../util/queries.js";

export const lockProductsForDealsOnAzn = async (
  domain,
  limit = 0,
  action,
  taskId
) => {
  const collectionName = domain;
  const db = await getArbispotterDb();

  const { query, options } = lockProductsForDealsOnAznQuery(
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
    const query = setProductsLockedForDealsOnAznQuery(taskId);
    await db
      .collection(collectionName)
      .updateMany({ _id: { $in: documents.map((doc) => doc._id) } }, query);
  }

  return documents;
};
