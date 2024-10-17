import { Costs } from "@dipmaxtech/clr-pkg";
import { getCrawlDataDb } from "../mongo.js";

const collectionName = "asinean";

export const findAsin = async (asin: string) => {
  const db = await getCrawlDataDb();
  const collection = db.collection(collectionName);
  return collection.findOne({ asin });
};

export const findEan = async (ean: string) => {
  const db = await getCrawlDataDb();
  const collection = db.collection(collectionName);
  return collection.findOne({ eans: ean });
};

export const upsertAsin = async (asin: string, eanList: string[], costs: Costs) => {
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
        updatedAt: new Date().toISOString(),
      },
    },
    {
      upsert: true,
    }
  );
};
