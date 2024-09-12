import { DbProductRecord, ObjectId } from "@dipmaxtech/clr-pkg";
import { Action } from "../../../types/tasks/Tasks";
import { getArbispotterDb } from "../../mongo";
import {
  lockProductsForLookupInfoQuery,
  setProductsLockedForLookupInfoQuery,
} from "../../util/queries";
export const lockProductsForLookupInfo = async (
  domain: string,
  limit = 0,
  action: Action,
  taskId: ObjectId,
  hasEan: boolean
) => {
  const collectionName = domain;
  const db = await getArbispotterDb();

  const { query, options } = lockProductsForLookupInfoQuery(
    taskId,
    limit,
    action,
    hasEan
  );

  const documents = await db
    .collection(collectionName)
    .find(query, options)
    .toArray() as DbProductRecord[];

  // Update documents to mark them as locked
  if (action !== "recover") {
    const query = setProductsLockedForLookupInfoQuery(taskId);
    await db
      .collection(collectionName)
      .updateMany({ _id: { $in: documents.map((doc) => doc._id) } }, query);
  }

  return documents;
};
