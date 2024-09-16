import { getArbispotterDb } from "../db/mongo.js";
import {
  deleteArbispotterProduct,
  findArbispotterProducts,
} from "../db/util/crudArbispotterProduct.js";
import { getAllShopsAsArray } from "../db/util/shops.js";
import {
  DbProductRecord,
  removeSearchParams,
} from "@dipmaxtech/clr-pkg";
import { createHash } from "../util/hash.js";
import { recalculateEbyMargin } from "../util/recalculateEbyMargin.js";

const query = {};

const migrationProperties = async () => {
  const spotter = await getArbispotterDb();
  const shops = await getAllShopsAsArray();
  const activeShops = shops!.filter(
    (shop) =>
      shop.active &&
      shop.d !== "mueller.de" &&
      shop.d !== "dm.de" &&
      shop.d !== "fressnapf.de" &&
      shop.d !== "bergfreunde.de" && 
      shop.d !== ''
  );
  for (let index = 0; index < activeShops.length; index++) {
    const shop = activeShops[index];
    let total = await spotter.collection(shop.d).countDocuments(query);

    console.log("Processing shop:", shop.d, "total:", total);
    let cnt = 0;
    let count = 0;
    const batchSize = 1000;
    while (count < total && total > 0) {
      const spotterBulkWrites: any[] = [];
      const products = await findArbispotterProducts(
        shop.d,
        query,
        batchSize,
        cnt
      );
      if (products.length) {
        await Promise.all(
          products.map(async (product) => {
            count++;
            let update: Partial<DbProductRecord> = {};

            const { ebyCategories, e_costs } = product;

            update["lnk"] = removeSearchParams(product.lnk);

            const findDocuments = await spotter
              .collection(shop.d)
              .find({ lnk: RegExp(update["lnk"]) })
              .toArray();
            if (findDocuments.length === 1) {
              if (ebyCategories && ebyCategories.length && e_costs) {
                recalculateEbyMargin(product, update);
              }
              update["s_hash"] = createHash(product.lnk);
              spotterBulkWrites.push({
                updateOne: {
                  filter: { _id: product._id },
                  update: { $set: update },
                },
              });
            } else {
              if (findDocuments.length === 2) {
                await deleteArbispotterProduct(shop.d, product._id);
              } else {
                findDocuments.pop();
                await Promise.all(
                  findDocuments.map(async (doc) => {
                    const { _id } = doc;
                    await deleteArbispotterProduct(shop.d, _id);
                  })
                );
              }
            }
          })
        );
        if (spotterBulkWrites.length) {
          const result = await spotter
            .collection(shop.d)
            .bulkWrite(spotterBulkWrites, { ordered: false });
          console.log(shop.d, " result: ", result);
        }
      } else {
        total = 0;
        console.log(`Done ${shop.d}`);
      }

      console.log("Processing batch:", cnt, "count:", count);
      cnt++;
    }
  }
};

migrationProperties().then((r) => {
  process.exit(0);
});
