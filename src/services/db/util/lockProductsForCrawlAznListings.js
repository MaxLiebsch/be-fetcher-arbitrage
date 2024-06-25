import { getArbispotterDb } from "../mongo.js";
import {
  lockProductsForCrawlAznListingsQuery,
  setProductsLockedForCrawlAznListingsQuery,
} from "./queries.js";

/*
  conditons:
  default:
   - lckd: false, undefined
   - taskId: ""
   - a_prc: 0
   - a_mrgn_pct: 0, <= MAX_EARNING_MARGIN
   - a_props: undefined, incomplete
  recover:
    - taskId: <hostname>:<taskId>
*/

export const lockProductsForCrawlAznListings = async (
  domain,
  limit = 0,
  taskId,
  action
) => {
  const collectionName = domain;
  const db = await getArbispotterDb();

  const { query, options } = lockProductsForCrawlAznListingsQuery(
    limit,
    taskId,
    action
  );

  const documents = await db
    .collection(collectionName)
    .find(query, options)
    .toArray();

  // Update documents to mark them as locked
  if (action !== "recover") {
    const query = setProductsLockedForCrawlAznListingsQuery(taskId);
    await db
      .collection(collectionName)
      .updateMany({ _id: { $in: documents.map((doc) => doc._id) } }, query);
  }

  return documents;
};
