import { MongoServerError } from "mongodb";
import {
  findProductByHash,
  insertArbispotterProduct,
  updateArbispotterProductHashQuery,
} from "./crudArbispotterProduct.js";
import { DbProductRecord, UpdateResult } from "@dipmaxtech/clr-pkg";

export const createOrUpdateArbispotterProduct = async (
  procProd: DbProductRecord
) => {
  const { s_hash: productHash } = procProd;
  const product = await findProductByHash(productHash);
  try {
    if (product) {
      return await updateArbispotterProductHashQuery(productHash, {
        $set: procProd,
      });
    } else {
      const newProduct = procProd;
      return await insertArbispotterProduct(newProduct);
    }
  } catch (error) {
    if (error instanceof MongoServerError) {
      if (error.code === 11000) {
        const result: UpdateResult<Document> = {
          acknowledged: false,
          matchedCount: 0,
          modifiedCount: 0,
          upsertedCount: 0,
          upsertedId: null,
        };
        return result;
      }
    }
  }
};
