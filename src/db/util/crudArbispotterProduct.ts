import { UTCDate } from "@date-fns/utc";
import { getArbispotterDb, getProductsCol } from "../mongo.js";
import {
  DbProductRecord,
  Filter,
  InsertOneResult,
  MongoError,
  ObjectId,
} from "@dipmaxtech/clr-pkg";

export const findProducts = async (
  query: Filter<DbProductRecord>,
  limit = 500,
  page = 0
) => {
  const productCol = await getProductsCol();
  return productCol
    .find({ ...query })
    .limit(limit ?? 500)
    .skip(page * limit)
    .toArray();
};

export const findArbispotterProducts = async (
  query: Filter<DbProductRecord>,
  limit = 500,
  page = 0
) => {
  const productCol = await getProductsCol();
  return productCol
    .find({ ...query })
    .limit(limit ?? 500)
    .skip(page * limit)
    .toArray();
};

export const findProductByHash = async (hash: string) => {
  const collection = await getProductsCol();
  return collection.findOne({ s_hash: hash });
};

export const insertArbispotterProduct = async (product: DbProductRecord) => {
  try {
    const productsCol = await getProductsCol();
    product["createdAt"] = new UTCDate().toISOString();
    product["updatedAt"] = new UTCDate().toISOString();

    return await productsCol.insertOne(product);
  } catch (error) {
    if (error instanceof MongoError) {
      console.error("Error creating product:", error?.message, product.lnk);
    }
    return { acknowledged: false } as InsertOneResult<Document>;
  }
};

export const updateArbispotterProductQuery = async (
  id: ObjectId,
  query: Filter<DbProductRecord>
) => {
  const maxRetries = 3;
  let attempt = 0;
  const productsCol = await getProductsCol();

  while (attempt < maxRetries) {
    try {
      if (query?.$set) {
        query.$set["updatedAt"] = new UTCDate().toISOString();
      } else {
        query["$set"] = { updatedAt: new UTCDate().toISOString() };
      }

      return await productsCol.updateOne({ _id: id }, query); // Exit the function if the update is successful
    } catch (e) {
      attempt++;
      if (e instanceof MongoError && e.code === 11000) {
        console.error(
          "Duplicate key error:",
          e.message,
          `${id.toString()}`,
          JSON.stringify(query)
        );
        break; // Exit the function
      } else if (attempt >= maxRetries) {
        if (e instanceof Error) {
          console.error(
            "Error updating product:",
            e?.message,
            `${id.toString()}`,
            JSON.stringify(query)
          );
        }
        return; // Exit the function
      }
    }
  }
};

export const updateArbispotterProductHashQuery = async (
  link: string,
  query: Filter<DbProductRecord>
) => {
  const maxRetries = 3;
  let attempt = 0;
  const productCol = await getProductsCol();

  while (attempt < maxRetries) {
    try {
      if (query?.$set) {
        query.$set["updatedAt"] = new UTCDate().toISOString();
      } else {
        query["$set"] = { updatedAt: new UTCDate().toISOString() };
      }

      return await productCol.updateOne({ lnk: link }, query); // Exit the function if the update is successful
    } catch (e) {
      attempt++;
      if (e instanceof MongoError && e.code === 11000) {
        console.error(
          "Duplicate key error:",
          e.message,
          link,
          JSON.stringify(query)
        );
        break; // Exit the function
      } else if (attempt >= maxRetries) {
        if (e instanceof Error) {
          console.error(
            "Error updating product:",
            e?.message,
            link,
            JSON.stringify(query)
          );
        }
        return; // Exit the function
      }
    }
  }
};

export const countArbispotterProducts = async (
  query: Filter<DbProductRecord>
) => {
  const productsCol = await getProductsCol();
  return productsCol.countDocuments(query);
};

export const findArbispotterProductsNoLimit = async (
  query: Filter<DbProductRecord>
): Promise<DbProductRecord[]> => {
  const productsCol = await getProductsCol();
  return productsCol.find({ ...query }).toArray();
};

export const moveArbispotterProduct = async (to: string, id: ObjectId) => {
  try {
    const toCollectionName = to;
    const db = await getArbispotterDb();
    const productsCol = await getProductsCol();
    const toCollection = db.collection(toCollectionName);

    const product = await productsCol.findOne({ _id: id });

    if (!product) return null;

    const graved = await toCollection.findOne({ lnk: product.lnk });

    if (!graved) {
      await toCollection.insertOne(product);
    }

    await productsCol.deleteOne({ _id: id });

    return product;
  } catch (error) {
    console.log("error:", error);
    return null;
  }
};

export const deleteArbispotterProduct = async (id: ObjectId) => {
  const productsCol = await getProductsCol();
  return productsCol.deleteOne({ _id: id });
};
