import { Filter } from "mongodb";
import { getCrawlDataDb, logsCollectionName } from "../mongo";

export const deleteLogs = async () => {
  const db = await getCrawlDataDb();
  const collection = db.collection(logsCollectionName);
  return collection.deleteMany({});
};

export const getLogs = async (query: Filter<Document>) => {
  const db = await getCrawlDataDb();
  const collection = db.collection<any>(logsCollectionName);

  return collection.find(query).toArray();
};
