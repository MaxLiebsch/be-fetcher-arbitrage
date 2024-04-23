import { last } from "underscore";
import clientPool from "./mongoPool.js";
import os from "os";

const arbispotter_db = "arbispotter";
const crawler_data_db = "crawler-data";
const sitemapcollectionName = "sitemaps";
const tasksCollectionName = "tasks";
const shopCollectionName = "shops";

const getCollection = async (name) => {
  const client = await clientPool[crawler_data_db];
  return client.db().collection(name);
};

const getArbispotterDb = async () => {
  const client = await clientPool[arbispotter_db];
  return client.db();
};

const getCrawlerDataDb = async () => {
  const client = await clientPool[crawler_data_db];
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
  const sitemap = await (
    await getCollection(sitemapcollectionName)
  )
    .find({
      "sitemap.name": domain,
    })
    .toArray();

  if (sitemap.length) {
    return sitemap[0];
  } else {
    return null;
  }
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
  return await collection.updateOne(
    { link: product.link },
    { $set: { ...product } },
    {
      upsert: true,
    }
  );
};

export const findCrawledProductByName = async (domain, name) => {
  const collectionName = domain + ".products";
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);
  return await collection.findOne({ name });
};

export const findCrawledProductByLink = async (domain, link) => {
  const collectionName = domain + ".products";
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);
  return await collection.findOne({ link });
};

export const updateCrawledProduct = async (domain, link, update) => {
  const collectionName = domain + ".products";
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);
  await collection.updateOne(
    { link: link },
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

export const lockProducts = async (domain, limit = 0, taskId, action) => {
  const collectionName = domain + ".products";
  const db = await getCrawlerDataDb();

  const options = {};
  const query = {};

  if (action === "recover") {
    query["taskId"] = taskId.toString();
  } else {
    query["locked"] = { $exists: true, $eq: false };
    query["matched"] = { $exists: true, $eq: false };
  }

  if (limit) {
    options["limit"] = limit;
  }

  const documents = await db
    .collection(collectionName)
    .find(query, options)
    .toArray();

  // Update documents to mark them as locked
  await db
    .collection(collectionName)
    .updateMany(
      { _id: { $in: documents.map((doc) => doc._id) } },
      { $set: { locked: true, taskId: taskId.toString() } }
    );

  return documents;
};

//arbispotter
export const upsertProduct = async (domain, product) => {
  const collectionName = domain;
  const db = await getArbispotterDb();
  const collection = db.collection(collectionName);
  return await collection.replaceOne({ lnk: product.lnk }, product, {
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
  const taskCollection = db.collection(collectionName);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const twentyFourAgo = new Date();
  twentyFourAgo.setHours(twentyFourAgo.getHours() - 24);

  const ninetyMinutesAgo = new Date();
  ninetyMinutesAgo.setMinutes(ninetyMinutesAgo.getMinutes() - 90);

  const task = await taskCollection.findOneAndUpdate(
    {
      $and: [
        {
          maintenance: false,
        },
        {
          $or: [
            { startedAt: "" },
            { startedAt: { $lte: ninetyMinutesAgo.toISOString() } },
          ],
        },
        {
          $or: [
            {
              $and: [
                { completed: { $eq: false } },
                { executing: { $eq: false } },
                // { errored: { $eq: false } },
              ],
            },
            {
              $or: [
                {
                  $and: [
                    { completed: { $eq: true } },
                    { recurrent: { $eq: true } },
                    { executing: { $eq: false } },
                    // { errored: { $eq: false } },
                    { completedAt: { $lte: sevenDaysAgo.toISOString() } }, // Crawl Job
                  ],
                },
                {
                  $and: [
                    { type: "LOOKUP_PRODUCTS" },
                    { completed: { $eq: true } },
                    { recurrent: { $eq: true } },
                    { executing: { $eq: false } },
                    // { errored: { $eq: false } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      $set: {
        executing: true,
        lastCrawler: os.hostname(),
        startedAt: new Date().toISOString(),
      },
    },
    { returnNewDocument: true }
  );
  if (task) {
    if (task.type === "LOOKUP_PRODUCTS") {
      const shopProductCollectionName = task.shopDomain + ".products";
      const shopProductCollection = db.collection(shopProductCollectionName);
      const count = await shopProductCollection.count({
        $and: [
          { matched: false, locked: false },
          {
            $or: [
              { matchedAt: { $exists: false } },
              { matchedAt: { $lte: twentyFourAgo.toISOString() } },
            ],
          },
        ],
      });
      if (count === 0) {
        await updateTask(task._id, {
          executing: false,
          lastCrawler: "",
        });
        return null;
      }
    }

    return task;
  } else {
    return null;
  }
};

export const findTasks = async (query) => {
  const collectionName = tasksCollectionName;
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);

  return collection.find(query).toArray();
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

export const getAllShops = async (shopsDomains = []) => {
  const collectionName = shopCollectionName;
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);
  const shops = await collection.find({ d: { $in: shopsDomains } }).toArray();
  return shops;
};

export const getShops = async (retailerList) => {
  const collectionName = shopCollectionName;
  const db = await getCrawlerDataDb();
  const collection = db.collection(collectionName);

  const retailerListQueryArr = retailerList.reduce((targetShops, shop) => {
    targetShops.push(shop.d);
    return targetShops;
  }, []);

  const shops = await collection
    .find({ d: { $in: retailerListQueryArr } })
    .toArray();
  if (shops.length) {
    return retailerList.reduce((acc, val) => {
      const shop = shops.find((shop) => shop.d === val.d);
      acc[val.d] = shop;
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

export const updateShopStats = async (shopDomain) => {
  const db = await getArbispotterDb();
  const shopCollection = db.collection(shopDomain);
  if (!shopCollection) return;

  const total = await shopCollection.count();
  const a_fat_total = await shopCollection.count({
    a_mrgn_pct: { $gt: 0 },
  });
  const e_fat_total = await shopCollection.count({
    e_mrgn_pct: { $gt: 0 },
  });
  const shopsCollection = db.collection(shopCollectionName);
  if (!shopsCollection) return;

  return await shopsCollection.updateOne(
    { d: shopDomain },
    {
      $set: {
        a_fat_total,
        e_fat_total,
        total,
      },
    }
  );
};
