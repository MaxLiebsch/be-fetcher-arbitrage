import { DbProductRecord, ObjectId } from "@dipmaxtech/clr-pkg";
import { getArbispotterDb } from "../../../../mongo.js";
import {
  lockProductsForDealsOnAznQuery,
  setProductsLockedForDealsOnAznQuery,
} from "../../../queries.js";
import { Action } from "../../../../../types/tasks/Tasks.js";

export const lockProductsForDealsOnAzn = async (
  domain: string,
  limit = 0,
  action: Action,
  taskId: ObjectId
) => {
  const collectionName = domain;
  const db = await getArbispotterDb();

  const { query, options } = lockProductsForDealsOnAznQuery(
    domain,
    limit,
    taskId,
    action
  );

  const documents = (await db
    .collection(collectionName)
    .find(query, options)
    .toArray()) as DbProductRecord[];

  // Update documents to mark them as locked
  if (action !== "recover") {
    const query = setProductsLockedForDealsOnAznQuery(taskId);
    await db
      .collection(collectionName)
      .updateMany({ _id: { $in: documents.map((doc) => doc._id) } }, query);
  }

  return documents;
};
