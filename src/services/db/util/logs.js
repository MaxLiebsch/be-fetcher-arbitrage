import { getCrawlerDataDb, hostname, logsCollectionName } from "../mongo.js";

export const deleteLogs = async () => {
  const db = await getCrawlerDataDb();
  const collection = db.collection(logsCollectionName);
  return await collection.deleteMany({});
};
