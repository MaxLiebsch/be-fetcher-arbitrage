import { getArbispotterDb } from "../db/mongo.js";
import { findArbispotterProducts } from "../db/util/crudArbispotterProduct.js";
import { getAllShopsAsArray } from "../db/util/shops.js";
import { countTotal } from "./countProducts.js";
import { resetAznProductQuery } from "../db/util/aznQueries.js";
import { resetEbyProductQuery } from "../db/util/ebyQueries.js";

const cleanUpProductsWithLowNamingScore = async () => {
  const spotter = await getArbispotterDb();
  const shops = await getAllShopsAsArray();
  const activeShops = shops.filter((shop) => shop.active);
  activeShops.push({ d: "sales" });
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
      const spotterBulkWrites = [];
      const products = await findArbispotterProducts(
        shop.d,
        {
          $or: [
            {
              $expr: {
                $lt: [
                  {
                    $convert: {
                      input: { $ifNull: ["$a_vrfd.score", 0.6] },
                      to: "double",
                      onError: 0.6,
                      onNull: 0.6,
                    },
                  },
                  0.6,
                ],
              },
            },
            {
              $expr: {
                $lt: [
                  {
                    $convert: {
                      input: { $ifNull: ["$e_vrfd.score", 0.6] },
                      to: "double",
                      onError: 0.6,
                      onNull: 0.6,
                    },
                  },
                  0.6,
                ],
              },
            },
          ],
        },
        batchSize,
        cnt
      );
      if (products.length) {
        products.map((p) => {
          count++;
          let update = {};
          const { a_vrfd, e_vrfd } = p;
          if (a_vrfd?.score || e_vrfd?.score) {
            update["$unset"] = {};
          }

          if (Number(p.a_vrfd?.score) < 0.6) {
            const azn = resetAznProductQuery();
            update.$unset = { ...azn.$unset };
          }

          if (Number(p.e_vrfd?.score) < 0.6) {
              console.log('Number(p.e_vrfd?.score):', Number(p.e_vrfd?.score))
            const eby = resetEbyProductQuery();
            update.$unset = { ...update.$unset, ...eby.$unset };
          }

          let spotterBulk = {
            updateOne: {
              filter: { _id: p._id },
              update,
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

cleanUpProductsWithLowNamingScore().then((r) => {
  process.exit(0);
});
