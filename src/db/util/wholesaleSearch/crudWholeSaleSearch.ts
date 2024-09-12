import { DbProductRecord, ObjectId } from "@dipmaxtech/clr-pkg";
import { getCrawlDataDb, hostname } from "../../mongo.js";
import { UTCDate } from "@date-fns/utc";
import { Action } from "../../../types/tasks/Tasks.js";
import { Options, Query } from "../queries.js";
import { Filter, UpdateFilter } from "mongodb";

const collectionName = "wholesale";

export const unlockProduts = async (products: DbProductRecord[]) => {
  const db = await getCrawlDataDb();
  await db.collection(collectionName).updateMany(
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

export const lockWholeSaleProducts = async (
  limit = 0,
  taskId: ObjectId,
  action: Action
) => {
  const db = await getCrawlDataDb();

  const options: Options = {};
  const query: Query = {};

  query["taskId"] = `${taskId.toString()}`;

  if (action === "recover") {
    query["clrName"] = `${hostname}`;
  } else {
    query["locked"] = { $eq: false };
    query["lookup_pending"] = { $eq: true };
    query["clrName"] = { $eq: "" };
    if (limit) {
      options["limit"] = limit;
    }
  }

  const documents = await db
    .collection(collectionName)
    .find(query, options)
    .toArray();

  // Update documents to mark them as locked
  if (action !== "recover")
    await db
      .collection(collectionName)
      .updateMany(
        { _id: { $in: documents.map((doc) => doc._id) } },
        { $set: { locked: true, clrName: `${hostname}` } }
      );

  return documents;
};

export const updateWholeSaleProduct = async (
  productId: ObjectId,
  update: UpdateFilter<DbProductRecord>
) => {
  const db = await getCrawlDataDb();
  const collection = db.collection(collectionName);

  update["updatedAt"] = new UTCDate().toISOString();

  return collection.updateOne(
    { _id: productId },
    {
      $set: {
        ...update,
      },
    }
  );
};

export const updateWholeSaleProducts = async (
  query: Filter<DbProductRecord>,
  update: UpdateFilter<DbProductRecord>
) => {
  const db = await getCrawlDataDb();
  const collection = db.collection<DbProductRecord>(collectionName);
  return collection.updateMany(query, {
    $set: {
      ...update,
    },
  });
};

export const deleteProductsForTask = async (taskId: ObjectId) => {
  const db = await getCrawlDataDb();
  const collection = db.collection(collectionName);
  return collection.deleteMany({ taskId });
};
