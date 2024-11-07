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

export const updateProducts = async (
  query: Filter<DbProductRecord>,
  update: { [key: string]: any }
) => {
  const productsCol = await getProductsCol();
  return productsCol.updateMany({ ...query }, { ...update });
};

export const findProductByHash = async (hash: string) => {
  const collection = await getProductsCol();
  return collection.findOne({ s_hash: hash });
};

export const insertProduct = async (product: DbProductRecord) => {
  try {
    const productsCol = await getProductsCol();
    product["createdAt"] = new Date().toISOString();
    product["updatedAt"] = new Date().toISOString();

    return await productsCol.insertOne(product);
  } catch (error) {
    if (error instanceof MongoError) {
      console.error("Error creating product:", error?.message, product.lnk);
    }
    return { acknowledged: false } as InsertOneResult<Document>;
  }
};

export const updateProductWithQuery = async (
  id: ObjectId,
  query: Filter<DbProductRecord>
) => {
  const maxRetries = 3;
  let attempt = 0;
  const productsCol = await getProductsCol();

  while (attempt < maxRetries) {
    try {
      if (query?.$set) {
        query.$set["updatedAt"] = new Date().toISOString();
      } else {
        query["$set"] = { updatedAt: new Date().toISOString() };
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

export const updateProductHashQuery = async (
  hash: string,
  query: Filter<DbProductRecord>
) => {
  const maxRetries = 3;
  let attempt = 0;
  const productCol = await getProductsCol();

  while (attempt < maxRetries) {
    try {
      if (query?.$set) {
        query.$set["updatedAt"] = new Date().toISOString();
      } else {
        query["$set"] = { updatedAt: new Date().toISOString() };
      }

      return await productCol.updateOne({ s_hash: hash }, query); // Exit the function if the update is successful
    } catch (e) {
      attempt++;
      if (e instanceof MongoError && e.code === 11000) {
        console.error(
          "Duplicate key error:",
          e.message,
          hash,
          JSON.stringify(query)
        );
        break; // Exit the function
      } else if (attempt >= maxRetries) {
        if (e instanceof Error) {
          console.error(
            "Error updating product:",
            e?.message,
            hash,
            JSON.stringify(query)
          );
        }
        return; // Exit the function
      }
    }
  }
};

export const countProducts = async (query: Filter<DbProductRecord>) => {
  const productsCol = await getProductsCol();
  return productsCol.countDocuments(query);
};

export const findProduct = async (query: Filter<DbProductRecord>) => {
  const productsCol = await getProductsCol();
  return productsCol.findOne({ ...query });
};

export const findProductsNoLimit = async (
  query: Filter<DbProductRecord>
): Promise<DbProductRecord[]> => {
  const productsCol = await getProductsCol();
  return productsCol.find({ ...query }).toArray();
};

export const moveProduct = async (to: string, id: ObjectId) => {
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

export const deleteProduct = async (id: ObjectId) => {
  const productsCol = await getProductsCol();
  return productsCol.deleteOne({ _id: id });
};


export const deleteAllProducts = async (domain: string) => {
  const productsCol = await getProductsCol();
  return productsCol.deleteMany({ sdmn: domain });
};

export const emptyProductDb = async () => {
  const productsCol = await getProductsCol();
  return productsCol.deleteMany({});
};


export const insertProducts = async (products: DbProductRecord[]) => {
  try {
    const productsCol = await getProductsCol();
    products.forEach((product) => {
      product["createdAt"] = new Date().toISOString();
      product["updatedAt"] = new Date().toISOString();
    });

    return await productsCol.insertMany(products);
  } catch (error) {
    if (error instanceof MongoError) {
      console.error("Error creating products:", error?.message);
    }
    return { acknowledged: false } as InsertOneResult<Document>;
  }
};
