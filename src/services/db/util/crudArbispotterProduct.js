import { MAX_EARNING_MARGIN } from "../../../constants.js";
import { getArbispotterDb, hostname } from "../mongo.js";

export const countProducts = async (domain, query = {}) => {
  const collectionName = domain;
  const db = await getArbispotterDb();
  const collection = db.collection(collectionName);
  return collection.countDocuments({ ...query});
};

export const findProducts = async (domain, query, limit = 500, page = 0) => {
  const collectionName = domain;
  const db = await getArbispotterDb();
  const collection = db.collection(collectionName);
  return collection
    .find({ ...query })
    .limit(limit??500)
    .skip(page * limit)
    .toArray();
};

export const findProduct = async (domain, name) => {
  const collectionName = domain;
  const db = await getArbispotterDb();
  const collection = db.collection(collectionName);
  return collection.findOne({ nm: name });
};

export const findProductByLink = async (domain, link) => {
  const collectionName = domain;
  const db = await getArbispotterDb();
  const collection = db.collection(collectionName);
  return collection.findOne({ lnk: link });
};

export const lockArbispotterProducts = async (
  domain,
  limit = 0,
  taskId,
  action
) => {
  const collectionName = domain;
  const db = await getArbispotterDb();

  const options = {};
  let query = {};

  if (action === "recover") {
    query["taskId"] = `${hostname}:${taskId.toString()}`;
  } else {
    query = {
      $and: [
        {
          $and: [
            { a_prc: { $gt: 0 } },
            { a_mrgn_pct: { $gt: 0, $lte: MAX_EARNING_MARGIN } },
          ],
        },
        {
          $or: [{ lckd: { $exists: false } }, { lckd: { $eq: false } }],
        },
        {
          $or: [
            { a_props: { $exists: false } },
            { a_props: { $in: ["incomplete"] } },
          ],
        },
      ],
    };
  }

  if (limit && action !== "recover") {
    options["limit"] = limit;
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
        { $set: { lckd: true, taskId: `${hostname}:${taskId.toString()}` } }
      );

  return documents;
};

export const upsertProduct = async (domain, product) => {
  const collectionName = domain;
  const db = await getArbispotterDb();
  const collection = db.collection(collectionName);

  product["createdAt"] = new Date().toISOString();
  product["updatedAt"] = new Date().toISOString();

  return collection.replaceOne({ lnk: product.lnk }, product, {
    upsert: true,
  });
};

export const updateProduct = async (domain, link, update) => {
  const collectionName = domain;
  const db = await getArbispotterDb();
  const collection = db.collection(collectionName);
  update["updatedAt"] = new Date().toISOString();
  return collection.updateOne(
    { lnk: link },
    {
      $set: {
        ...update,
      },
    }
  );
};


export const moveArbispotterProduct = async (from, to, _id) => {
  const fromCollectionName = from;
  const toCollectionName = to;
  const db = await getArbispotterDb();
  const fromCollection = db.collection(fromCollectionName);
  const toCollection = db.collection(toCollectionName);

  const product = await fromCollection.findOne({ _id });

  await toCollection.insertOne(product);
  await fromCollection.deleteOne({ _id });

  return product;
};

export const updateProducts = async (domain, query, update) => {
  const collectionName = domain;
  const db = await getArbispotterDb();
  const collection = db.collection(collectionName);
  return collection.updateMany(
    { ...query },
    {
      $set: {
        ...update,
      },
    }
  );
};

export const deleteAllArbispotterProducts = async (domain) => {
  const collectionName = domain;
  const db = await getArbispotterDb();
  const collection = db.collection(collectionName);
  return collection.deleteMany({});
};
