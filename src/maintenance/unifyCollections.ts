import { AnyBulkWriteOperation, DbProductRecord } from "@dipmaxtech/clr-pkg";
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
    let cnt = 0;
    let page = 0;
    while (cnt < total) {
      const productBulks: AnyBulkWriteOperation<DbProductRecord>[] = [];
      const products = (await shopCol
        .find(query)
        .skip(page * batchSize)
        .limit(batchSize)
        .toArray()) as DbProductRecord[];

      for (const product of products) {
        const productBulk = {
          insertOne: {
            document: { ...product, sdmn: domain },
          },
        };
        productBulks.push(productBulk);
      }
      try {
        await productsCol.bulkWrite(productBulks);
        await shopCol.updateMany(
          { _id: { $in: products.map((p) => p._id) } },
          { $set: { transferred: true } }
        );
        console.log(
          `Transferred ${productBulks.length} products for ${domain}`
        );
      } catch (error) {
        console.error(error);
      }
      page++;
      cnt += products.length;
    }
  }
}

unifyCollections()
  .then((r) => process.exit(0))
  .catch((e) => process.exit(1));
