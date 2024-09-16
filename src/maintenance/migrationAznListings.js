import { getArbispotterDb } from "../db/mongo.js";
import { findArbispotterProducts } from "../db/util/crudArbispotterProduct.js";
import { getAllShopsAsArray } from "../db/util/shops.js";
import { countTotal } from "./countProducts.js";
import { resetAznProductQuery } from "../db/util/aznQueries.js";

const migrationAznListings = async () => {
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
          $or: [{ "costs.azn": 0 }, { info_prop: "missing" }],
        },
        batchSize,
        cnt
      );
      if (products.length) {
        products.map((p) => {
          count++;
          let update = {};

          if (p.info_prop === "missing" || p.costs.azn === 0) {
            update = resetAznProductQuery({ info_prop: "missing" });
            if(p.infoUpdatedAt){
              update.$set.infoUpdatedAt = p.infoUpdatedAt;
            }
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

migrationAznListings().then((r) => {
  process.exit(0);
});
