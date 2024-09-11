import { MongoServerError } from "mongodb";
import { subDateDaysISO } from "../../../util/dates.js";
import { createHash, verifyHash } from "../../../util/hash.js";
import {
  findProductByLink,
  updateArbispotterProductQuery,
  updateArbispotterProductSet,
  upsertArbispotterProduct,
} from "./crudArbispotterProduct.js";
import { RECHECK_EAN_INTERVAL } from "../../../constants.js";
import { parseISO } from "date-fns";
import { UTCDate } from "@date-fns/utc";

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

export const createOrUpdateArbispotterProduct = async (domain, procProd) => {
  const { lnk } = procProd;
  const product = await findProductByLink(domain, lnk);
  try {
    if (product) {
      return await updateArbispotterProductQuery(domain, lnk, {
        $set: procProd,
      });
    } else {
      const newProduct = procProd;
      return await upsertArbispotterProduct(domain, newProduct);
    }
  } catch (error) {
    if (error instanceof MongoServerError) {
      if (error.code === 11000) {
        return { acknowledged: false, upsertedId: null };
      }
    }
  }
};
