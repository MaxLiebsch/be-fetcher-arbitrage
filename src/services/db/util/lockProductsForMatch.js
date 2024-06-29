import { getCrawlerDataDb, hostname } from "../mongo.js";
import { lockProductsForMatchQuery, setProductsLockedForMatchQuery } from "./queries.js";

export const lockProductsForMatch = async (
  domain,
  limit = 0,
  taskId,
  action,
  hasEan
) => {
  const collectionName = domain  ;
  const db = await getCrawlerDataDb();

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

export const unlockProduts = async (domain, products) => {
  const collectionName = domain  ;
  const db = await getCrawlerDataDb();
  return db.collection(collectionName).updateMany(
    {
      _id: {
        $in: products.reduce((ids, product) => {
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
