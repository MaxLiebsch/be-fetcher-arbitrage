import { getArbispotterDb } from "../../mongo.js";
import {
  lockProductsForUpdateProductinfoQuery,
  setProductsLockedForUpdateProductinfoQuery,
} from "../queries.js";

export const lockProductsForUpdateProductinfo = async (
  domain,
  limit = 0,
  action,
  taskId
) => {
  const collectionName = domain;
  const db = await getArbispotterDb();

  const { query, options } = lockProductsForUpdateProductinfoQuery(
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
    const query = setProductsLockedForUpdateProductinfoQuery(taskId);
    await db
      .collection(collectionName)
      .updateMany({ _id: { $in: documents.map((doc) => doc._id) } }, query);
  }

  return documents;
};
