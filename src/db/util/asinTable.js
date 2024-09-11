import { getCrawlDataDb } from "../mongo.js";
import { UTCDate } from "@date-fns/utc";
const collectionName = "asinean";

export const findAsin = async (asin) => {
  const db = await getCrawlDataDb();
  const collection = db.collection(collectionName);
  return collection.findOne({ asin });
};

export const findEan = async (ean) => {
  const db = await getCrawlDataDb();
  const collection = db.collection(collectionName);
  return collection.findOne({ eans: ean });
};

export const upsertAsin = async (asin, eanList, costs) => {
  const db = await getCrawlDataDb();
  const collection = db.collection(collectionName);

  return collection.updateOne(
    { asin },
    {
      $addToSet: {
        eans: { $each: eanList },
      },
      $set: {
        costs,
        updatedAt: new UTCDate().toISOString(),
      },
    },
    {
      upsert: true,
    }
  );
};
