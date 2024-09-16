import { DbProductRecord, ObjectId } from "@dipmaxtech/clr-pkg";
import { getArbispotterDb } from "../../mongo.js";
import {
  lockProductsForCrawlEbyListingsAggregation,
  setProductsLockedForCrawlEbyListingsQuery,
} from "../queries.js";
import { Action } from "../../../types/tasks/Tasks.js";

export const lockProductsForCrawlEbyListings = async (
  domain: string,
  limit = 0,
  taskId: ObjectId,
  action: Action
) => {
  const collectionName = domain;
  const db = await getArbispotterDb();

  const agg = lockProductsForCrawlEbyListingsAggregation(limit, taskId, action);

  const documents = await db
    .collection<DbProductRecord>(collectionName)
    .aggregate(agg)
    .toArray() as DbProductRecord[];

  // Update documents to mark them as locked
  if (action !== "recover") {
    const query = setProductsLockedForCrawlEbyListingsQuery(taskId);
    await db
      .collection(collectionName)
      .updateMany({ _id: { $in: documents.map((doc) => doc._id) } }, query);
  }

  return documents;
};
