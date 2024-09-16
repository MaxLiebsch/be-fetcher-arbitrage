import { getArbispotterDb } from "../db/mongo.js";
import { findArbispotterProducts } from "../db/util/crudArbispotterProduct.js";
import { getAllShopsAsArray } from "../db/util/shops.js";
import { countTotal } from "./countProducts.js";

const convertStringScoreToNumber = async () => {
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
      const products = await findArbispotterProducts(shop.d, {
        $or: [
          { "a_vrfd.score": { $type: "string" } },
          { "e_vrfd.score": { $type: "string" } },
        ],
      });
      if (products.length) {
        products.map((p) => {
          count++;
          let update = {};
          const { a_vrfd, e_vrfd } = p;

          const cleanScore = (score) => {
            if (typeof score === "string") {
              // Remove extra double quotes
              score = score.replace(/^"+|"+$/g, "");
              return parseFloat(score);
            }
            return score;
          };
          if (a_vrfd && typeof a_vrfd.score === "string") {
            const parsedScore = cleanScore(a_vrfd.score);
            if (!isNaN(parsedScore)) {
              update["$set"] = { "a_vrfd.score": parsedScore };
            }
          }

          if (e_vrfd && typeof e_vrfd.score === "string") {
            const parsedScore = cleanScore(e_vrfd.score);
            if (!isNaN(parsedScore)) {
              update["$set"] = {
                ...update["$set"],
                "e_vrfd.score": parsedScore,
              };
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

convertStringScoreToNumber().then((r) => {
  process.exit(0);
});
