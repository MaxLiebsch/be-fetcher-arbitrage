import clientPool from "./mongoPool.js";

const arbispotter_db = "arbispotter";
const crawler_data_db = "crawler_data";
const sitemapcollectionName = "sitemaps";
const tasksCollectionName = "tasks";
const shopCollectionName = "shops";

/*
  crawler_data
  tasks,
  sitemaps,  
  <domain>.products

  arbispotter
  <domain>
  shops
*/

const getCollection = async (name) => {
  const client = await clientPool["crawler-data"];
  return client.db().collection(name);
};

const getArbispotterDb = async () => {
  const client = await clientPool["arbispotter"];
  return client.db();
};

const getCrawlerDataDb = async () => {
  const client = await clientPool["crawler-data"];
  return client.db();
};

export const doesCollectionExists = async (name) => {
  const collections = (await getCrawlerDataDb()).collections();
  return collections.some((collection) => collection.collectionName === name);
};

export const createCollection = async (name) => {
  const db = await getCrawlerDataDb();
  return db.createCollection(name);
};

export const createArbispotterCollection = async (name) => {
  const db = await getArbispotterDb();
  return db.createCollection(name);
};

export const getSiteMap = async (domain) => {
  const sitemap = (await getCollection(sitemapcollectionName))
    .find({
      name: domain,
    })
    .toArray();
  return sitemap;
};

export const upsertSiteMap = async (domain, stats) => {
  const sitemap = (await getCollection(sitemapcollectionName)).replaceOne(
    { "sitemap.name": domain },
    stats,
    { upsert: true }
  );
  return sitemap;
};

//Add crawled product //crawler-data
export const upsertCrawledProduct = async (domain, product) => {
  const collectionName = domain + ".products";
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);
  return await collection.replaceOne({ name: product.name }, product, {
    upsert: true,
  });
};

export const updateCrawledProduct = async (domain, name, update) => {
  const collectionName = domain + ".products";
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);
  await collection.updateOne(
    { name: name },
    {
      $set: {
        ...update,
      },
    }
  );
};

export const unlockProduts = async (domain, products) => {
  const collectionName = domain + ".products";
  const db = await getCrawlerDataDb();
  await db.collection(collectionName).updateMany(
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
      },
    }
  );
};

export const lockProducts = async (domain, limit = 0) => {
  const collectionName = domain + ".products";
  const db = await getCrawlerDataDb();

  const options = {};

  if (limit) {
    options["limit"] = limit;
  }

  const documents = await db
    .collection(collectionName)
    .find(
      {
        locked: { $exists: true, $eq: false },
        matched: { $exists: true, $eq: false },
      },
      options
    )
    .toArray();

  // Update documents to mark them as locked
  await db
    .collection(collectionName)
    .updateMany(
      { _id: { $in: documents.map((doc) => doc._id) } },
      { $set: { locked: true } }
    );

  return documents;
};

//arbispotter
export const upsertProduct = async (domain, product) => {
  const collectionName = domain;
  const db = await getArbispotterDb();
  const collection = db.collection(collectionName);
  return await collection.replaceOne({ nm: product.nm }, product, {
    upsert: true,
  });
};

export const updateProduct = async (domain, name, update) => {
  const collectionName = domain;
  const db = await getArbispotterDb();
  const collection = db.collection(collectionName);
  return await collection.updateOne(
    { name },
    {
      $set: {
        ...update,
      },
    }
  );
};

//Add raw products from matching //crawler-data
//Add matched product //arbispotter

export const getNewTask = async () => {
  const collectionName = tasksCollectionName;
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);
  const task = await collection
    .find({
      $and: [
        { completed: { $exists: true, $eq: false } },
        { executing: { $exists: true, $eq: false } },
        { errored: { $exists: true, $eq: false } },
      ],
    })
    .toArray();
  if (task.length) {
    return task[0];
  } else {
    return null;
  }
};

export const getTasks = async () => {
  const collectionName = tasksCollectionName;
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);
  return collection.find().toArray();
};

export const updateTask = async (id, update) => {
  const collectionName = tasksCollectionName;
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);
  return await collection.updateOne(
    { _id: id },
    {
      $set: {
        ...update,
      },
    }
  );
};

export const addTask = async (task) => {
  const collectionName = tasksCollectionName;
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);
  return collection.insertOne(task);
};

export const deleteTask = async (id) => {
  const collectionName = tasksCollectionName;
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);
  return collection.findOneAndDelete({ _id: id });
};

//getShop

export const getShops = async (domains) => {
  const collectionName = shopCollectionName;
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);
  const shops = await collection.find({ d: { $in: domains } }).toArray();
  if (shops.length) {
    return domains.reduce((acc, val) => {
      const shop = shops.find((shop) => shop.d === val);
      acc[val] = shop;
      return acc;
    }, {});
  } else {
    return null;
  }
};

export const inserShop = async (shop) => {
  const collectionName = shopCollectionName;
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);
  return await collection.replaceOne({ d: shop.d }, shop, { upsert: true });
};
