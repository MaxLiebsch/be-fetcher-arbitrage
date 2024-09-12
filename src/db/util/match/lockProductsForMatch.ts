import { DbProductRecord, ObjectId } from "@dipmaxtech/clr-pkg";
import { getArbispotterDb } from "../../mongo";
import {
  lockProductsForMatchQuery,
  setProductsLockedForMatchQuery,
} from "../queries";
import { Action } from "../../../types/tasks/Tasks";

export const lockProductsForMatch = async (
  taskId: ObjectId,
  domain: string,
  action: Action,
  hasEan: boolean,
  limit = 0
) => {
  const collectionName = domain;
  const db = await getArbispotterDb();

  const { query, options } = lockProductsForMatchQuery(
    limit,
    taskId,
    action,
    hasEan
  );
  const documents = await db
    .collection(collectionName)
    .find(query, options)
    .toArray();

  // Update documents to mark them as locked
  if (action !== "recover") {
    const query = setProductsLockedForMatchQuery(taskId);
    await db
      .collection(collectionName)
      .updateMany({ _id: { $in: documents.map((doc) => doc._id) } }, query);
  }

  return documents;
};

export const unlockProduts = async (
  domain: string,
  products: DbProductRecord[]
) => {
  const collectionName = domain;
  const db = await getArbispotterDb();
  return db.collection(collectionName).updateMany(
    {
      _id: {
        $in: products.reduce<ObjectId[]>((ids, product) => {
          ids.push(product._id);
          return ids;
        }, []),
      },
    },
    {
      $set: {
        locked: false,
        taskId: "",
      },
    }
  );
};
