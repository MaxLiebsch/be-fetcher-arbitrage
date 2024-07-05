import { MongoServerError } from "mongodb";
import { createHash } from "../../../util/hash.js";
import {
  findCrawledProductByLink,
  insertCrawlDataProduct,
  updateCrawlDataProduct,
  upsertCrawledProduct,
} from "./crudCrawlDataProduct.js";

export const createOrUpdateCrawlDataProduct = async (domain, rawProd) => {
  const product = await findCrawledProductByLink(domain, rawProd.link);
  try {
    if (product) {
      const s_hash = createHash(rawProd.link);
      return await updateCrawlDataProduct(domain, rawProd.link, {
        ...rawProd,
        s_hash,
      });
    } else {
      const s_hash = createHash(rawProd.link);
      rawProd["s_hash"] = s_hash;
      return await insertCrawlDataProduct(domain, rawProd);
    }
  } catch (error) {
    console.log("error:", error);
    if (error instanceof MongoServerError) {
      if (error.code === 11000) {
        return { acknowledged: false, upsertedId: null };
      }
    }
  }
};
