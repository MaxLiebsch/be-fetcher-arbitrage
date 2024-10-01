import { DbProductRecord, ObjectId } from "@dipmaxtech/clr-pkg";
import { getProductsCol, hostname, wholeSaleColname } from "../../mongo.js";
import { Action } from "../../../types/tasks/Tasks.js";
import { Options, Query } from "../queries.js";
import { MultiStageTaskTypes, TASK_TYPES } from "../../../util/taskTypes.js";

export const lockWholeSaleProducts = async (
  limit = 0,
  taskId: ObjectId,
  action: Action,
  taskType: MultiStageTaskTypes
) => {
  const productCol = await getProductsCol();
  const options: Options = {};
  let query: Query = {
    sdmn: wholeSaleColname,
  };

  query["taskIds"] = taskId.toString();
  const lock =
    taskType === TASK_TYPES.WHOLESALE_EBY_SEARCH ? "e_locked" : "a_locked";

  if (action === "recover") {
    query = {
      sdmn: wholeSaleColname,
      clrName: `${hostname}`,
    };
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

  const documents = (await productCol
    .find(query, options)
    .toArray()) as DbProductRecord[];

  // Update documents to mark them as locked
  if (action !== "recover")
    await productCol.updateMany(
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
