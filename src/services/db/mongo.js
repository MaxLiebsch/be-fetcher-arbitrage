import clientPool from "./mongoPool.js";
import os from "os";

export const arbispotter_db = "arbispotter";
export const crawl_data_db = "crawler-data";
export const sitemapcollectionName = "sitemaps";
export const tasksCollectionName = "tasks";
export const logsCollectionName = "logs";
export const shopCollectionName = "shops";
export const hostname = os.hostname();

export const getCollection = async (name) => {
  const client = await clientPool[crawl_data_db];
  return client.db().collection(name);
};

export const getArbispotterDb = async () => {
  const client = await clientPool[arbispotter_db];
  return client.db();
};

export const getCrawlDataDb = async () => {
  const client = await clientPool[crawl_data_db];
  return client.db();
};

export const doesCollectionCrawlDataExists = async (name) => {
  const db = await getCrawlDataDb();
  const collections = await db.collections();
  return collections.some((collection) => collection.collectionName === name);
};
export const doesCollectionArbispotterExists = async (name) => {
  const db = await getArbispotterDb();
  const collections = await db.collections();
  return collections.some((collection) => collection.collectionName === name);
};

export const createCrawlDataCollection = async (name) => {
  if (await doesCollectionCrawlDataExists(name)) return;
  const db = await getCrawlDataDb();
  const newCollection = await db.createCollection(name);
  await newCollection.createIndex({ link: 1 }, { unique: true });
  return newCollection;
};

export const createArbispotterCollection = async (name) => {
  if (await doesCollectionArbispotterExists(name)) return;
  const db = await getArbispotterDb();
  const collection = await db.createCollection(name);
  await collection.createIndex({ lnk: 1 }, { unique: true });
  await collection.createIndex({ a_mrgn: -1, a_mrgn_pct: -1 });
  await collection.createIndex({ a_w_mrgn: -1, a_w_mrgn_pct: -1 });
  await collection.createIndex({ a_p_mrgn: -1, a_p_mrgn_pct: -1 });
  await collection.createIndex({ a_w_p_mrgn: -1, a_w_p_mrgn_pct: -1 });
  await collection.createIndex({ e_mrgn: -1, e_mrgn_pct: -1 });
  await collection.createIndex({ a_pblsh: 1 });
  await collection.createIndex({ e_pblsh: 1 });
  return collection;
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
