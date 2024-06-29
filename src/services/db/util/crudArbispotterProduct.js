import { getArbispotterDb } from "../mongo.js";

export const countProducts = async (domain, query = {}) => {
  const collectionName = domain;
  const db = await getArbispotterDb();
  const collection = db.collection(collectionName);
  return collection.countDocuments({ ...query });
};
export const findArbispotterProducts = async (domain, query, limit = 500, page = 0) => {
  const collectionName = domain;
  const db = await getArbispotterDb();
  const collection = db.collection(collectionName);
  return collection
    .find({ ...query })
    .limit(limit ?? 500)
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
