import { Action } from "../../../../../types/tasks/Tasks.js";
import { getArbispotterDb } from "../../../../mongo.js";
import {
  lockProductsForNegMarginAznListingsQuery,
  setProductsLockedForCrawlAznListingsQuery,
} from "../../../queries.js";
import { DbProductRecord, ObjectId } from "@dipmaxtech/clr-pkg";

export const lockProductsForNegMarginAznListings = async (
  domain: string,
  limit = 0,
  taskId: ObjectId,
  action: Action
) => {
  const collectionName = domain;
  const db = await getArbispotterDb();

  const { query, options } = lockProductsForNegMarginAznListingsQuery(
    domain,
    limit,
    taskId,
    action
  );

  const documents = await db
    .collection<DbProductRecord>(collectionName)
    .find(query, options)
    .toArray() as DbProductRecord[];

  // Update documents to mark them as locked
  if (action !== "recover") {
    const query = setProductsLockedForCrawlAznListingsQuery(taskId);
    await db
      .collection(collectionName)
      .updateMany({ _id: { $in: documents.map((doc) => doc._id) } }, query);
  }

  return documents;
};
