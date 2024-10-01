import { DbProductRecord, ObjectId } from "@dipmaxtech/clr-pkg";
import { Action } from "../../../types/tasks/Tasks.js";
import { getProductsCol } from "../../mongo.js";
import { progressAggs } from "./progressQueryFns.js";
import {
  LockProductTaskTypes,
  MultiShopTaskTypesWithAgg,
} from "../../../util/taskTypes.js";
import { lockProductQueries } from "./lockProductsQueryFns.js";

export const lockProducts = async (
  taskType: LockProductTaskTypes,
  domain: string,
  limit = 0,
  action: Action,
  taskId: ObjectId,
  hasEan?: boolean
) => {
  const productCol = await getProductsCol();

  const { lock, set } = lockProductQueries[taskType];

  const { query, options } = lock(taskId, domain, limit, action, hasEan);

  const documents = (await productCol
    .find(query, options)
    .toArray()) as DbProductRecord[];

  // Update documents to mark them as locked
  if (action !== "recover") {
    const query = set(taskId);
    await productCol.updateMany(
      { _id: { $in: documents.map((doc) => doc._id) } },
      query
    );
  }

  return documents;
};

export const lockProductsWithAgg = async (
  taskType: MultiShopTaskTypesWithAgg,
  domain: string,
  limit = 0,
  taskId: ObjectId,
  action: Action,
  hasEan?: boolean
) => {
  const productCol = await getProductsCol();

  const { lock, set } = progressAggs[taskType];

  const agg = lock(taskId, domain, limit, action, hasEan);

  const documents = (await productCol
    .aggregate(agg)
    .toArray()) as DbProductRecord[];

  // Update documents to mark them as locked
  if (action !== "recover") {
    const query = set(taskId);
    await productCol.updateMany(
      { _id: { $in: documents.map((doc) => doc._id) } },
      query
    );
  }

  return documents;
};
