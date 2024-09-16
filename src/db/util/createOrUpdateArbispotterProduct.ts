import { MongoServerError } from "mongodb";
import {
  findProductByHash,
  insertArbispotterProduct,
  updateArbispotterProductHashQuery,
} from "./crudArbispotterProduct";
import { DbProductRecord, UpdateResult } from "@dipmaxtech/clr-pkg";

//ARBISPOTTER DB UTILS
// Remove keepa properties
export const keepaProperties = [
  { name: "categories" },
  { name: "k_eanList" },
  { name: "brand" },
  { name: "numberOfItems" },
  { name: "availabilityAmazon" },
  { name: "categoryTree" },
  { name: "salesRanks" }, // Sales Rank nullable
  { name: "monthlySold" },
  { name: "ahstprcs" }, // Amazon history prices
  { name: "anhstprcs" }, // Amazon new history prices
  { name: "auhstprcs" }, // Amazon used history prices
  { name: "curr_ahsprcs" },
  { name: "curr_ansprcs" },
  { name: "curr_ausprcs" },
  { name: "curr_salesRank" },
  { name: "avg30_ahsprcs" }, // Average of the Amazon history prices of the last 30 days
  { name: "avg30_ansprcs" }, // Average of the Amazon history prices of the last 30 days
  { name: "avg30_ausprcs" }, // Average of the Amazon history prices of the last 30 days
  { name: "avg30_salesRank" }, // Average of the Amazon history prices of the last 30 days
  { name: "avg90_ahsprcs" }, // Average of the Amazon history prices of the last 90 days
  { name: "avg90_ansprcs" }, // Average of the Amazon history prices of the last 90 days
  { name: "avg90_ausprcs" }, // Average of the Amazon history prices of the last 90 days
  { name: "avg90_salesRank" }, // Average of the Amazon history prices of the last 90 days
  { name: "buyBoxIsAmazon" },
  { name: "stockAmount" }, //  The stock of the Amazon offer, if available. Otherwise undefined.
  { name: "stockBuyBox" }, // he stock of the buy box offer, if available. Otherwise undefined.
  { name: "totalOfferCount" }, // The total count of offers for this product (all conditions combined). The offer count per condition can be found in the current field.
];

export const createOrUpdateArbispotterProduct = async (
  domain: string,
  procProd: DbProductRecord
) => {
  const { s_hash: productHash } = procProd;
  const product = await findProductByHash(domain, productHash);
  try {
    if (product) {
      return await updateArbispotterProductHashQuery(domain, productHash, {
        $set: procProd,
      });
    } else {
      const newProduct = procProd;
      return await insertArbispotterProduct(domain, newProduct);
    }
  } catch (error) {
    if (error instanceof MongoServerError) {
      if (error.code === 11000) {
        const result: UpdateResult<Document> = {
          acknowledged: false,
          matchedCount: 0,
          modifiedCount: 0,
          upsertedCount: 0,
          upsertedId: null
        }
        return result;
      }
    }
  }
};
