import { getArbispotterDb, getCrawlDataDb } from "../../../mongo.js";
import {
  lockProductsForDealsOnEbyAgg,
  setProductsLockedForDealsOnEbyQuery,
} from "../../../util/queries.js";

export const lockProductsForDealsOnEby = async (
  domain,
  limit = 0,
  action,
  taskId
) => {
  const collectionName = domain;
  const db = await getArbispotterDb();

  const agg = lockProductsForDealsOnEbyAgg(taskId, limit, action);

  const documents = await db
    .collection(collectionName)
    .aggregate(agg)
    .toArray();

  // Update documents to mark them as locked
  if (action !== "recover") {
    const query = setProductsLockedForDealsOnEbyQuery(taskId);
    await db
      .collection(collectionName)
      .updateMany({ _id: { $in: documents.map((doc) => doc._id) } }, query);
  }

  return documents;
};
