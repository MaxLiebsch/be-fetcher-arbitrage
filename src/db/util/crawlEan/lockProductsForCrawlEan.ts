import { DbProductRecord, ObjectId } from "@dipmaxtech/clr-pkg";
import { Action } from "../../../types/tasks/Tasks.js";
import { getArbispotterDb } from "../../mongo.js";
import {
  lockProductsForCrawlEanQuery,
  setProductsLockedForCrawlEanQuery,
} from "../../util/queries.js";

export const lockProductsForCrawlEan = async (
  domain: string,
  limit = 0,
  action: Action,
  taskId: ObjectId
) => {
  const collectionName = domain;
  const db = await getArbispotterDb();

  const { query, options } = lockProductsForCrawlEanQuery(
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
    const query = setProductsLockedForCrawlEanQuery(taskId);
    await db
      .collection(collectionName)
      .updateMany({ _id: { $in: documents.map((doc) => doc._id) } }, query);
  }

  return documents;
};
