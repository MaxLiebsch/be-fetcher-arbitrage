import { UTCDate } from "@date-fns/utc";
import { getArbispotterDb } from "../mongo.js";
import { MongoError, UpdateFilter } from "mongodb";
import { DbProductRecord, Filter, ObjectId } from "@dipmaxtech/clr-pkg";

const getCollection = async (collectionName: string) => {
  const db = await getArbispotterDb();
  return db.collection<DbProductRecord>(collectionName);
};

export const countProducts = async (domain: string, query = {}) => {
  const collectionName = domain;
  const collection = await getCollection(collectionName);
  return collection.countDocuments(query);
};

export const findArbispotterProduct = async (
  domain: string,
  query: Filter<DbProductRecord>
) => {
  const collectionName = domain;
  const collection = await getCollection(collectionName);
  return collection.findOne(query);
};

export const insertArbispotterProducts = async (
  domain: string,
  products: DbProductRecord[]
) => {
  const collectionName = domain;
  const collection = await getCollection(collectionName);
  return collection.insertMany(products);
};

export const findArbispotterProducts = async (
  domain: string,
  query: Filter<DbProductRecord>,
  limit = 500,
  page = 0
) => {
  const collectionName = domain;
  const collection = await getCollection(collectionName);
  return collection
    .find({ ...query })
    .limit(limit ?? 500)
    .skip(page * limit)
    .toArray();
};
export const findProduct = async (domain: string, name: string) => {
  const collectionName = domain;
  const collection = await getCollection(collectionName);
  return collection.findOne({ nm: name });
};
export const findProductByLink = async (domain: string, link: string) => {
  const collectionName = domain;
  const collection = await getCollection(collectionName);
  return collection.findOne({ lnk: link });
};
export const upsertArbispotterProduct = async (
  domain: string,
  product: DbProductRecord
) => {
  const collectionName = domain;
  const collection = await getCollection(collectionName);

  product["createdAt"] = new UTCDate().toISOString();
  product["updatedAt"] = new UTCDate().toISOString();

  return collection.updateOne(
    { lnk: product.lnk },
    { $set: { ...product } },
    {
      upsert: true,
    }
  );
};

export const insertArbispotterProduct = async (
  domain: string,
  product: DbProductRecord
) => {
  try {
    const collectionName = domain;
    const db = await getArbispotterDb();
    const collection = db.collection(collectionName);

    product["createdAt"] = new UTCDate().toISOString();
    product["updatedAt"] = new UTCDate().toISOString();

    await collection.insertOne(product);
    return;
  } catch (error) {
    if (error instanceof MongoError) {
      console.error("Error creating product:", error?.message, product.lnk);
    }
    return;
  }
};

export const updateArbispotterProductQuery = async (
  domain: string,
  link: string,
  query: Filter<DbProductRecord>
) => {
  const maxRetries = 3;
  let attempt = 0;
  const collectionName = domain;
  const collection = await getCollection(collectionName);

  while (attempt < maxRetries) {
    try {
      if (query?.$set) {
        query.$set["updatedAt"] = new UTCDate().toISOString();
      } else {
        query["$set"] = { updatedAt: new UTCDate().toISOString() };
      }

      return await collection.updateOne({ lnk: link }, query); // Exit the function if the update is successful
    } catch (e) {
      attempt++;
      if (e instanceof MongoError && e.code === 11000) {
        console.error(
          "Duplicate key error:",
          e.message,
          link,
          JSON.stringify(query)
        );
        break; // Exit the function
      } else if (attempt >= maxRetries) {
        if (e instanceof Error) {
          console.error(
            "Error updating product:",
            e?.message,
            link,
            JSON.stringify(query)
          );
        }
        return; // Exit the function
      }
    }
  }
};

export const updateAProductSet = async (
  domain: string,
  _id: ObjectId,
  update: UpdateFilter<DbProductRecord>
) => {
  const collectionName = domain;
  const collection = await getCollection(collectionName);
  update["updatedAt"] = new UTCDate().toISOString();

  return collection.updateOne(
    { _id: ObjectId },
    {
      $set: {
        ...update,
      },
    }
  );
};

export const updateProductQuery = async (
  domain: string,
  _id: ObjectId,
  query: Filter<DbProductRecord>
) => {
  const maxRetries = 3;
  let attempt = 0;
  const collectionName = domain;
  const collection = await getCollection(collectionName);

  while (attempt < maxRetries) {
    try {
      if (query?.$set) {
        query.$set["updatedAt"] = new UTCDate().toISOString();
      } else {
        query["$set"] = { updatedAt: new UTCDate().toISOString() };
      }

      return await collection.updateOne({ _id: _id }, query); // Exit the function if the update is successful
    } catch (e) {
      attempt++;
      if (e instanceof MongoError && e.code === 11000) {
        console.error(
          "Duplicate key error:",
          e.message,
          _id,
          JSON.stringify(query)
        );
        break; // Exit the function
      } else if (attempt >= maxRetries) {
        if (e instanceof Error) {
          console.error(
            "Error updating product:",
            e?.message,
            _id,
            JSON.stringify(query)
          );
        }
        return; // Exit the function
      }
    }
  }
};

export const updateArbispotterProductSet = async (
  domain: string,
  link: string,
  update: UpdateFilter<DbProductRecord>
) => {
  const collectionName = domain;
  const collection = await getCollection(collectionName);
  update["updatedAt"] = new UTCDate().toISOString();

  return collection.updateOne(
    { lnk: link },
    {
      $set: {
        ...update,
      },
    }
  );
};

export const findArbispotterProductsNoLimit = async (
  domain: string,
  query: Filter<DbProductRecord>
) => {
  const collectionName = domain;
  const collection = await getCollection(collectionName);
  return collection.find({ ...query }).toArray();
};

export const moveArbispotterProduct = async (
  from: string,
  to: string,
  lnk: string
) => {
  try {
    const fromCollectionName = from;
    const toCollectionName = to;
    const db = await getArbispotterDb();
    const fromCollection = db.collection(fromCollectionName);
    const toCollection = db.collection(toCollectionName);

    const product = await fromCollection.findOne({ lnk });

    if (!product) return null;

    await toCollection.insertOne(product);
    await fromCollection.deleteOne({ lnk });

    return product;
  } catch (error) {
    console.log("error:", error);
    return null;
  }
};
export const updateArbispotterProducts = async (
  domain: string,
  query: Filter<DbProductRecord>,
  update: UpdateFilter<DbProductRecord>
) => {
  const collectionName = domain;
  const collection = await getCollection(collectionName);
  return collection.updateMany(
    { ...query },
    {
      $set: {
        ...update,
      },
    }
  );
};

export const deleteArbispotterProduct = async (
  domain: string,
  link: string
) => {
  const collectionName = domain;
  const collection = await getCollection(collectionName);
  return collection.deleteOne({ lnk: link });
};

export const deleteAllArbispotterProducts = async (domain: string) => {
  const collectionName = domain;
  const collection = await getCollection(collectionName);
  return collection.deleteMany({});
};
