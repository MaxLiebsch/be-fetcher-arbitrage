import { getArbispotterDb } from "../db/mongo.js";
import { findArbispotterProducts } from "../db/util/crudArbispotterProduct.js";
import { getActiveShops, getAllShopsAsArray } from "../db/util/shops.js";
import { calculateMonthlySales } from "@dipmaxtech/clr-pkg";
import { countTotal } from "./countProducts.js";

const migrationMonthlySold = async () => {
  const spotter = await getArbispotterDb();
  const shops = await getActiveShops();

  if (!shops) return;

  const activeShops = shops.filter((shop) => shop.active);

  let count = 0;
  let sampleSize = await countTotal();
  for (let index = 0; index < activeShops.length; index++) {
    const shop = activeShops[index];

    console.log("Processing shop:", shop.d);
    let cnt = 0;
    const batchSize = 250;
    let hasMoreProducts = true;
    let complete = false;
    while (!complete) {
      const spotterBulkWrites: any = [];
      const products = await findArbispotterProducts(
        {
          $and: [
            { sdmn: shop.d },
            { categories: { $exists: true, $ne: null } },
            { salesRanks: { $exists: true, $ne: null } },
            { categoryTree: { $exists: true, $ne: null } },
          ],
        },
        batchSize,
        cnt
      );
      if (products.length) {
        products.map((p) => {
          count++;
          const set: any = {};

          if (p.categories && p.salesRanks && p.categoryTree) {
            const monthlySold = calculateMonthlySales(
              p.categories,
              p.salesRanks,
              p.categoryTree
            );
            monthlySold !== null &&
              monthlySold > 0 &&
              console.log("Monthly sold: ", monthlySold);
            if (monthlySold) {
              set["monthlySold"] = monthlySold;
            }
          }

          let spotterBulk = {
            updateOne: {
              filter: { _id: p._id },
              update: { $set: { ...set } },
            },
          };

          spotterBulkWrites.push(spotterBulk);
        });
        await spotter.collection(shop.d).bulkWrite(spotterBulkWrites);
      } else {
        console.log(`Done ${shop.d}`);
      }

      console.log(
        "Processing batch:",
        cnt,
        "count:",
        count,
        "hasMoreProducts: ",
        products.length === batchSize
      );
      hasMoreProducts = products.length === batchSize;
      if (count >= sampleSize || !hasMoreProducts) {
        complete = true;
      }
      cnt++;
    }
  }
};

migrationMonthlySold().then((r) => {
  process.exit(0);
});
