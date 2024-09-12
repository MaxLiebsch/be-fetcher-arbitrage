import { getArbispotterDb } from "../../mongo";
import {
  lockProductsForLookupCategoryQuery,
  setProductsLockedForLookupCategoryQuery,
} from "../../util/queries";
import { DbProductRecord, ObjectId } from "@dipmaxtech/clr-pkg";
import { Action } from "../../../types/tasks/Tasks";

export const lockProductsForLookupCategory = async (
  domain: string,
  limit = 0,
  action: Action,
  taskId: ObjectId
) => {
  const collectionName = domain;
  const db = await getArbispotterDb();

  const { query, options } = lockProductsForLookupCategoryQuery(
    taskId,
    limit,
    action
  );

  const documents = (await db
    .collection(collectionName)
    .find(query, options)
    .toArray()) as DbProductRecord[];

  // Update documents to mark them as locked
  if (action !== "recover") {
    const query = setProductsLockedForLookupCategoryQuery(taskId);
    await db
      .collection(collectionName)
      .updateMany({ _id: { $in: documents.map((doc) => doc._id) } }, query);
  }

  return documents;
};
