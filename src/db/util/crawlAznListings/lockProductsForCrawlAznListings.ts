import { Action } from "../../../types/tasks/Tasks";
import { getArbispotterDb } from "../../mongo";
import {
  lockProductsForCrawlAznListingsQuery,
  setProductsLockedForCrawlAznListingsQuery,
} from "../queries";
import { DbProductRecord, ObjectId } from "@dipmaxtech/clr-pkg";

export const lockProductsForCrawlAznListings = async (
  domain: string,
  limit = 0,
  taskId: ObjectId,
  action: Action
) => {
  const collectionName = domain;
  const db = await getArbispotterDb();

  const { query, options } = lockProductsForCrawlAznListingsQuery(
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
