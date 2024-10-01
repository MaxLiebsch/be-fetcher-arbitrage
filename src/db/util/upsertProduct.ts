import { MongoServerError } from "mongodb";
import {
  findProductByHash,
  insertProduct,
  updateProductWithQuery,
} from "./crudProducts.js";
import { DbProductRecord, UpdateResult } from "@dipmaxtech/clr-pkg";

export const upsertProduct = async (
  procProd: DbProductRecord
) => {
  const { s_hash: productHash } = procProd;
  const product = await findProductByHash(productHash);
  try {
    if (product) {
      const { _id: productId } = product;
      return await updateProductWithQuery(productId, {
        $set: procProd,
      });
    } else {
      const newProduct = procProd;
      return await insertProduct(newProduct);
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
