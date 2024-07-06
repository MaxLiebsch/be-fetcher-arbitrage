import { createHash } from "../../../util/hash.js";
import { getCrawlDataDb } from "../mongo.js";

//Add crawled product //crawler-data
export const upsertCrawlDataProduct = async (domain, product) => {
  const collectionName = domain;
  const db = await getCrawlDataDb();
  const collection = db.collection(collectionName);
  product["createdAt"] = new Date().toISOString();
  product["updatedAt"] = new Date().toISOString();

  const s_hash = createHash(product.link);

  return collection.updateOne(
    { link: product.link },
    { $set: { ...product, s_hash } },
    {
      upsert: true,
    }
  );
};

export const insertCrawlDataProduct = async (domain, product) => {
  const collectionName = domain;
  const db = await getCrawlDataDb();
  const collection = db.collection(collectionName);
  product["createdAt"] = new Date().toISOString();
  product["updatedAt"] = new Date().toISOString();
  return collection.insertOne(product);
};

export const findCrawledProductByName = async (domain, name) => {
  const collectionName = domain;
  const db = await getCrawlDataDb();
  const collection = db.collection(collectionName);
  return collection.findOne({ name });
};
export const findCrawledProductByLink = async (domain, link) => {
  const collectionName = domain;
  const db = await getCrawlDataDb();
  const collection = db.collection(collectionName);
  return collection.findOne({ link });
};
export const updateCrawlDataProduct = async (domain, link, update) => {
  const collectionName = domain;
  const db = await getCrawlDataDb();
  const collection = db.collection(collectionName);

  update["updatedAt"] = new Date().toISOString();

  return collection.updateOne(
    { link },
    {
      $set: {
        ...update,
      },
    }
  );
};
export const updateCrawlDataProducts = async (domain, query, update) => {
  const collectionName = domain;
  const db = await getCrawlDataDb();
  const collection = db.collection(collectionName);

  update["updatedAt"] = new Date().toISOString();

  return collection.updateMany(
    { ...query },
    {
      $set: {
        ...update,
      },
    }
  );
};
export const deleteAllProducts = async (domain) => {
  const collectionName = domain;
  const db = await getCrawlDataDb();
  const collection = db.collection(collectionName);
  return collection.deleteMany({});
};
export const deleteProduct = async (domain, link) => {
  const collectionName = domain;
  const db = await getCrawlDataDb();
  const collection = db.collection(collectionName);
  return collection.deleteOne({ link });
};
export const findCrawlDataProducts = async (
  domain,
  query,
  limit = 500,
  page = 0
) => {
  const collectionName = domain;
  const db = await getCrawlDataDb();
  const collection = db.collection(collectionName);
  return collection
    .find({ ...query })
    .limit(limit ?? 500)
    .skip(page * limit)
    .toArray();
};
export const moveCrawledProduct = async (from, to, link) => {
  try {
    const fromCollectionName = from;
    const toCollectionName = to;
    const db = await getCrawlDataDb();
    const fromCollection = db.collection(fromCollectionName);
    const toCollection = db.collection(toCollectionName);

    const product = await fromCollection.findOne({ link });

    await toCollection.insertOne(product);
    await fromCollection.deleteOne({ link });

    return product;
  } catch (error) {
    console.log("error:", error);
    return null;
  }
};
export const copyProducts = async (from, to, _id) => {
  try {
    const fromCollectionName = from;
    const toCollectionName = to;
    const db = await getCrawlDataDb();
    const fromCollection = db.collection(fromCollectionName);
    const toCollection = db.collection(toCollectionName);

    const products = await fromCollection.find({ _id }).toArray();
    const productsWithShop = products.map((product) => {
      return { ...product, shop: from };
    });

    await toCollection.insertOne(productsWithShop);

    return productsWithShop;
  } catch (error) {
    console.log("error:", error);
    return null;
  }
};
