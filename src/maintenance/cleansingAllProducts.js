import { getArbispotterDb, getCrawlDataDb } from "../services/db/mongo.js";
import { findArbispotterProducts } from "../services/db/util/crudArbispotterProduct.js";
import { getAllShopsAsArray } from "../services/db/util/shops.js";
import { countTotal } from "./countProducts.js";
import { recalculateAznMargin } from "../util/recalculateAznMargin.js";
import { recalculateEbyMargin } from "../util/recalculateEbyMargin.js";
import { resetAznProductQuery } from "../services/db/util/aznQueries.js";
import { resetEbyProductQuery } from "../services/db/util/ebyQueries.js";
import { reduceSalesRankArray } from "@dipmaxtech/clr-pkg";

function isArrayOfNumberPairs(arr) {
  if (!Array.isArray(arr)) return false;

  return arr.every(
    (item) =>
      Array.isArray(item) &&
      item.length === 2 &&
      typeof item[0] === "number" &&
      typeof item[1] === "number"
  );
}

function isArrayOfNumbers(arr) {
  if (!Array.isArray(arr)) return false;
  return arr.every((item) => typeof item === "number");
}

const cleansingAllProducts = async () => {
  const spotter = await getArbispotterDb();
  const shops = await getAllShopsAsArray();
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
      const spotterBulkWrites = [];
      const products = await findArbispotterProducts(
        shop.d,
        {},
        batchSize,
        cnt
      );
      if (products.length) {
        products.map((p) => {
          const {
            a_prc,
            salesRanks,
            ahstprcs,
            auhstprcs,
            anhstprcs,
            e_prc,
            esin,
            asin,
            a_mrgn,
            e_mrgn,
            costs,
            ebyCategories,
          } = p;
          count++;
          const spotterSet = {};
          const unset = {
            $unset: {
              a_urpc: "",
              e_urpc: "",
              a_w_p_mrgn: "",
              a_w_p_mrgn_pct: "",
            },
          };

          /*
            * Cleansing the product
            a_mrgn: NaN a_prc, costs.azn > 0.3 neuberechnen

            a_prc = null, asin: "" resetAznQuery

            delete a_urpc, e_urpc  a_w_p_mrgn: "", a_w_p_mrgn_pct: "",


            e_mrgn NaN e_prc, ebyCategories.length > 0, ebyCategories.every(cat => typeof cat !== "number") neuberechnen

            e_prc = null, esin: "" resetEbyQuery
          */

          // a_mrgn: NaN a_prc, costs.azn > 0.3 neuberechnen
          if (!a_mrgn && a_prc && costs?.azn > 0.3) {
            recalculateAznMargin(p, spotterSet);
          }

          // e_mrgn NaN e_prc, ebyCategories.length > 0, ebyCategories.every(cat => typeof cat !== "number") neuberechnen
          if (!e_mrgn && e_prc && ebyCategories?.length > 0) {
            recalculateEbyMargin(p, spotterSet);
          }

          // a_prc = null, asin: "" resetAznQuery
          if (!a_prc && !asin) {
            const result = resetAznProductQuery();
            unset.$unset = { ...unset.$unset, ...result.$unset };
          }

          // e_prc = null, esin: "" resetEbyQuery
          if (!e_prc && !esin) {
            const result = resetEbyProductQuery();
            unset.$unset = { ...unset.$unset, ...result.$unset };
          }

          Object.keys(p).forEach((key) => {
            if (p[key] === null) {
              unset.$unset[key] = "";
            }
          });

          if (salesRanks) {
            const _salesRanks = salesRanks;
            Object.entries(salesRanks).forEach(([key, value]) => {
              if (value.length > 2 && isArrayOfNumbers(value)) {
                _salesRanks[key] = reduceSalesRankArray(value);
              }
            });
            if (Object.keys(_salesRanks).length > 0) {
              spotterSet["salesRanks"] = _salesRanks;
            } else {
              unset.$unset["salesRanks"] = "";
            }
          }

          if (ahstprcs && isArrayOfNumbers(ahstprcs)) {
            if (ahstprcs.length > 2) {
              spotterSet["ahstprcs"] = reduceSalesRankArray(ahstprcs);
            } else {
              unset.$unset["ahstprcs"] = "";
            }
          }
          if (auhstprcs && isArrayOfNumbers(auhstprcs)) {
            if (auhstprcs.length > 2) {
              spotterSet["auhstprcs"] = reduceSalesRankArray(auhstprcs);
            } else {
              unset.$unset["auhstprcs"] = "";
            }
          }
          if (anhstprcs && isArrayOfNumbers(anhstprcs)) {
            if (anhstprcs.length > 2) {
              spotterSet["anhstprcs"] = reduceSalesRankArray(anhstprcs);
            } else {
              unset.$unset["anhstprcs"] = "";
            }
          }

          let spotterBulk = {
            updateOne: {
              filter: { _id: p._id },
              update: {},
            },
          };

          if (Object.keys(spotterSet).length) {
            spotterBulk.updateOne.update.$set = spotterSet;
          }
          if (Object.keys(unset.$unset).length) {
            spotterBulk.updateOne.update = {
              ...spotterBulk.updateOne.update,
              ...unset,
            };
          }

          if(Object.keys(spotterBulk.updateOne.update).length === 0) {
            return;
          } 
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

cleansingAllProducts().then((r) => {
  process.exit(0);
});
