import { getArbispotterDb } from "../mongo.js";

export const countProducts = async (domain, query = {}) => {
  const collectionName = domain;
  const db = await getArbispotterDb();
  const collection = db.collection(collectionName);
  return collection.countDocuments({ ...query });
};

export const findArbispotterProduct = async (domain, query) => {
  const collectionName = domain;
  const db = await getArbispotterDb();
  const collection = db.collection(collectionName);
  return collection.findOne({ ...query });
}

export const findArbispotterProducts = async (
  domain,
  query,
  limit = 500,
  page = 0
) => {
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
export const upsertArbispotterProduct = async (domain, product) => {
  const collectionName = domain;
  const db = await getArbispotterDb();
  const collection = db.collection(collectionName);

  product["createdAt"] = new Date().toISOString();
  product["updatedAt"] = new Date().toISOString();

  return collection.updateOne(
    { lnk: product.lnk },
    { $set: { ...product } },
    {
      upsert: true,
    }
  );
};

export const insertArbispotterProduct = async (domain, product) => {
  const collectionName = domain;
  const db = await getArbispotterDb();
  const collection = db.collection(collectionName);

  product["createdAt"] = new Date().toISOString();
  product["updatedAt"] = new Date().toISOString();

  return collection.insertOne(product);
};

export const updateArbispotterProductQuery = async (domain, link, query) => {
  const collectionName = domain;
  const db = await getArbispotterDb();
  const collection = db.collection(collectionName);
  if (query?.$set) {
    query.$set["updatedAt"] = new Date().toISOString();
  } else {
    query["$set"] = { updatedAt: new Date().toISOString() };
  }

  return collection.updateOne(
    { lnk: link },
    {
      ...query,
    }
  );
};
export const updateArbispotterProduct = async (domain, link, update) => {
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
export const moveArbispotterProduct = async (from, to, lnk) => {
  try {
    const fromCollectionName = from;
    const toCollectionName = to;
    const db = await getArbispotterDb();
    const fromCollection = db.collection(fromCollectionName);
    const toCollection = db.collection(toCollectionName);

    const product = await fromCollection.findOne({ lnk });

    await toCollection.insertOne(product);
    await fromCollection.deleteOne({ lnk });

    return product;
  } catch (error) {
    console.log("error:", error);
    return null;
  }
};
export const updateArbispotterProducts = async (domain, query, update) => {
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
