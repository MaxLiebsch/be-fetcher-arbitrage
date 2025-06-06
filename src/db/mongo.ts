import { DbProductRecord, SiteMap } from "@dipmaxtech/clr-pkg";
import clientPool from "./mongoPool.js";
import os from "os";
export const arbispotter_db = "arbispotter";
export const crawl_data_db = "crawler-data";
export const config_db = "config";
export const sitemapcollectionName = "sitemaps";
export const tasksCollectionName = "tasks";
export const logsCollectionName = "logs";
export const shopCollectionName = "shops";
export const wholeSaleColname = "wholesale";
export const productsCollectionName = "products";
export const salesDbName = "sales";
export const hostname = os.hostname();

export const getCrawlDataCollection = async (name: string) => {
  const client = await clientPool[crawl_data_db];
  return client.db().collection(name);
};

export const getSettingsCol = async ()=> {
  const client = await clientPool[config_db];
  console.log('client:', client)
  return client.db('config').collection('settings');
}

export const getArbispotterCollection = async (name: string) => {
  const client = await clientPool[arbispotter_db];
  return client.db().collection(name);
};

export const getArbispotterDb = async () => {
  const client = await clientPool[arbispotter_db];
  return client.db();
};

export const getProductsCol = async () => {
  const db = await getArbispotterDb();
  return db.collection<DbProductRecord>(productsCollectionName);
};

export const getCrawlDataDb = async () => {
  const client = await clientPool[crawl_data_db];
  return client.db();
};

export const doesCollectionCrawlDataExists = async (name: string) => {
  const db = await getCrawlDataDb();
  const collections = await db.collections();
  return collections.some((collection) => collection.collectionName === name);
};
export const doesCollectionArbispotterExists = async (name: string) => {
  const db = await getArbispotterDb();
  const collections = await db.collections();
  return collections.some((collection) => collection.collectionName === name);
};

export const createCrawlDataCollection = async (name: string) => {
  if (await doesCollectionCrawlDataExists(name)) return;
  const db = await getCrawlDataDb();
  const newCollection = await db.createCollection(name);
  await newCollection.createIndex({ link: 1 }, { unique: true });
  return newCollection;
};

export const createCollection = async (name: string) => {
  if (await doesCollectionArbispotterExists(name)) return;
  const db = await getArbispotterDb();
  const collection = await db.createCollection(name);
  await collection.createIndex({ sdmn: 1 });
  await collection.createIndex({ lnk: 1 }, { unique: true });
  await collection.createIndex({ a_mrgn: -1, a_mrgn_pct: -1 });
  await collection.createIndex({ a_w_mrgn: -1, a_w_mrgn_pct: -1 });
  await collection.createIndex({ a_p_mrgn: -1, a_p_mrgn_pct: -1 });
  await collection.createIndex({ a_p_w_mrgn: -1, a_p_w_mrgn_pct: -1 });
  await collection.createIndex({ e_mrgn: -1, e_mrgn_pct: -1 });
  await collection.createIndex({ e_ns_mrgn: -1, e_ns_mrgn_pct: -1 });
  await collection.createIndex({ cat_prop: 1 });
  await collection.createIndex({ ean_prop: 1 });
  await collection.createIndex({ info_prop: 1 });
  await collection.createIndex({ eby_prop: 1 });
  await collection.createIndex({ keepaUpdatedAt: 1 });
  await collection.createIndex({ dealEbyUpdatedAt: 1 });
  await collection.createIndex({ dealAznUpdatedAt: 1 });
  await collection.createIndex({ ebyUpdatedAt: 1 });
  await collection.createIndex({ aznUpdatedAt: 1 });
  await collection.createIndex({ eanList: 1 });

  await collection.createIndex({ "a_vrfd.nm_prop": 1 });
  await collection.createIndex({ "a_vrfd.qty_prop": 1 });

  await collection.createIndex({ "e_vrfd.nm_prop": 1 });
  await collection.createIndex({ "e_vrfd.qty_prop": 1 });

  await collection.createIndex({ asin: 1 });
  await collection.createIndex({ esin: 1 });

  await collection.createIndex({ a_pblsh: 1 });
  await collection.createIndex({ e_pblsh: 1 });
  return collection;
};

export const getSiteMap = async (domain: string) => {
  const sitemap = await (
    await getCrawlDataCollection(sitemapcollectionName)
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

export const upsertSiteMap = async (domain: string, stats: SiteMap) => {
  const sitemap = (
    await getCrawlDataCollection(sitemapcollectionName)
  ).replaceOne(
    { "sitemap.name": domain },
    { dmn: domain, ...stats },
    { upsert: true }
  );
  return sitemap;
};
