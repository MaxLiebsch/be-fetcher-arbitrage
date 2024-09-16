import { getArbispotterDb, getCrawlDataDb } from "../db/mongo.js";
import { findArbispotterProducts } from "../db/util/crudArbispotterProduct.js";
import {
  aggregation,
  countAggregation,
} from "../db/util/posEbyAggregation.js";
import { getAllShopsAsArray } from "../db/util/shops.js";
import {
  calculateAznArbitrage,
  calculateEbyArbitrage,
  findMappedCategory,
  roundToTwoDecimals,
} from "@dipmaxtech/clr-pkg";

const query = {
  $or: [{ "a_vrfd.qty_prop": "complete" }, { "e_vrfd.qty_prop": "complete" }],
};

const resetQueryEansOnEby = async () => {
  const spotter = await getArbispotterDb();
  const shops = await getAllShopsAsArray();
  const activeShops = shops.filter((shop) => shop.active);
  for (let index = 0; index < activeShops.length; index++) {
    const shop = activeShops[index];
    const [total] = await spotter
      .collection(shop.d)
      .aggregate(countAggregation)
      .toArray();
    console.log("Processing shop:", shop.d, "total:", total);

    if (total) {
      let cnt = 0;
      let count = 0;
      let completed = false;
      while (!completed) {
        const spotterBulkWrites = [];

        const products = await spotter
          .collection(shop.d)
          .aggregate(aggregation)
          .toArray();
        if (products.length) {
          products.map((p) => {
            count++;
            let spotterBulk = {
              updateOne: {
                filter: { _id: p._id },
                update: { $unset: { eby_prop: "" } },
              },
            };
            spotterBulkWrites.push(spotterBulk);
          });
          await spotter.collection(shop.d).bulkWrite(spotterBulkWrites);
        } else {
          completed = true;
          console.log(`Done ${shop.d}`);
        }

        console.log("Processing batch:", cnt, "count:", count);
        cnt++;
      }
      console.log("total:", total.total);
    }
  }
};

resetQueryEansOnEby().then((r) => {
  process.exit(0);
});
