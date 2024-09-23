import { DbProductRecord, ObjectId } from "@dipmaxtech/clr-pkg";
import {
  getArbispotterDb,
  hostname,
  wholesaleCollectionName,
} from "../../mongo.js";
import { Action, WholeSaleTask } from "../../../types/tasks/Tasks.js";
import { Options, Query } from "../queries.js";
import { MultiStageTaskTypes, TASK_TYPES } from "../../../util/taskTypes.js";

const collectionName = wholesaleCollectionName;

export const lockWholeSaleProducts = async (
  limit = 0,
  taskId: ObjectId,
  action: Action,
  taskType: MultiStageTaskTypes
) => {
  const db = await getArbispotterDb();

  const options: Options = {};
  const query: Query = {};

  query["taskIds"] = taskId.toString();
  const lock =
    taskType === TASK_TYPES.WHOLESALE_EBY_SEARCH ? "e_locked" : "a_locked";

  if (action === "recover") {
    query["clrName"] = `${hostname}`;
  } else {
    if (taskType === TASK_TYPES.WHOLESALE_EBY_SEARCH) {
      query["e_lookup_pending"] = { $eq: true };
      query["target"] = "e";
    } else {
      query["a_lookup_pending"] = { $eq: true };
      query["target"] = "a";
    }

    if (limit) {
      options["limit"] = limit;
    }
  }

  const documents = (await db
    .collection(collectionName)
    .find(query, options)
    .toArray()) as DbProductRecord[];

  // Update documents to mark them as locked
  if (action !== "recover")
    await db.collection<WholeSaleTask>(collectionName).updateMany(
      { _id: { $in: documents.map((doc) => doc._id) } },
      {
        $set: {
          [lock]: true,
        },
        $push: {
          clrName: hostname,
        },
      }
    );

  return documents;
};
