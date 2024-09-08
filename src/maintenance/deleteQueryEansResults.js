import { getArbispotterDb, getCrawlDataDb } from "../services/db/mongo.js";
import { findArbispotterProducts } from "../services/db/util/crudArbispotterProduct.js";
import { resetEbyProductQuery } from "../services/db/util/ebyQueries.js";
import { getAllShopsAsArray } from "../services/db/util/shops.js";

const query = { eby_prop: "missing", e_prc: { $exists: true } };

const deleteQueryEansResults = async () => {
  const spotter = await getArbispotterDb();
  const shops = await getAllShopsAsArray();
  const activeShops = shops.filter((shop) => shop.active);
  for (let index = 0; index < activeShops.length; index++) {
    const shop = activeShops[index];
    const total = await spotter.collection(shop.d).countDocuments(query);

    console.log("Processing shop:", shop.d, "total:", total);
    let cnt = 0;
    let count = 0;
    const batchSize = 200;
    let completed = false;
    while (!completed) {
      const spotterBulkWrites = [];
      const products = await findArbispotterProducts(
        shop.d,
        query,
        batchSize,
        cnt
      );
      if (products.length) {
        products.map((p) => {
          count++;
          const resetEby = resetEbyProductQuery({
            eby_prop: "missing",
            cat_prop: "",
          });
          let spotterBulk = {
            updateOne: {
              filter: { _id: p._id },
              update: { ...resetEby },
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
  }
};

deleteQueryEansResults().then((r) => {
  process.exit(0);
});
