import {
  AnyBulkWriteOperation,
  DbProductRecord,
  MongoBulkWriteError,
  MongoError,
} from "@dipmaxtech/clr-pkg";
import { getArbispotterDb, getProductsCol } from "../db/mongo.js";
import { getActiveShops } from "../db/util/shops.js";

const query = {
  transferred: { $exists: false, $ne: true },
};

async function unifyCollections() {
  const activeShops = await getActiveShops();
  const spotterDb = await getArbispotterDb();
  const productsCol = await getProductsCol();
  const batchSize = 1000;

  if (!activeShops) return;

  for (const shop of activeShops) {
    const domain = shop.d;
    const shopCol = spotterDb.collection(domain);
    const total = await shopCol.countDocuments(query);
    if (total === 0) {
      console.log(`No products to transfer for ${domain}`);
      continue;
    }
    let cnt = 0;
    let page = 0;
    while (cnt < total) {
      const productBulks: AnyBulkWriteOperation<DbProductRecord>[] = [];
      const products = (await shopCol
        .find(query)
        .limit(batchSize)
        .toArray()) as DbProductRecord[];
      const ids = products.map((p) => p._id);
      const productLnks = products.map((p) => p.lnk);
      const productsInDb = await productsCol
        .find({ lnk: { $in: productLnks } })
        .toArray();
      const productsToAdd = products.filter(
        (p) => !productsInDb.find((pDb) => pDb.lnk === p.lnk)
      );
      for (const product of productsToAdd) {
        //@ts-ignore
        delete product._id;
        const productBulk = {
          insertOne: {
            document: { ...product, sdmn: domain },
          },
        };
        productBulks.push(productBulk);
      }
      try {
        if (productBulks.length > 0) {
          await productsCol.bulkWrite(productBulks);
          await shopCol.updateMany(
            { _id: { $in: ids } },
            { $set: { transferred: true } }
          );
          console.log(
            `Transferred ${productBulks.length} products for ${domain}`
          );
        } else {
          console.log(`No products to transfer for ${domain}`);
        }
      } catch (error) {
        if (error instanceof MongoBulkWriteError) {
          console.error(JSON.stringify(error.writeErrors, null, 2));
        }
      }
      page++;
      cnt += products.length;
    }
  }
}

unifyCollections()
  .then((r) => process.exit(0))
  .catch((e) => process.exit(1));
