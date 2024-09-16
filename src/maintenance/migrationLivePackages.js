
import { getArbispotterDb, getCrawlDataDb } from "../db/mongo.js";
import { findArbispotterProducts } from "../db/util/crudArbispotterProduct.js";
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

const migrationLivePackage = async () => {
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
          const set = {};
          const spotterSet = {};

          const { nm_vrfd, e_vrfd, a_vrfd } = p;

          if (nm_vrfd?.qty_prop === "complete") {
            set["qty"] = nm_vrfd.qty;
          }

          if (e_vrfd?.qty_prop === "complete") {
            set["e_qty"] = e_vrfd.qty;
          }

          if (a_vrfd?.qty_prop === "complete") {
            set["a_qty"] = a_vrfd.qty;
          }

          const { a_qty: aSellQty, e_qty: eSellQty, qty: buyQty } = set;

          const {
            prc: buyPrice,
            a_prc: aSellPrice,
            costs,
            tax,
            e_prc: eSellPrice,
            ebyCategories,
          } = p;

          if (buyQty && buyQty > 0) {
            spotterSet["uprc"] = roundToTwoDecimals(buyPrice / buyQty);
          } else {
            spotterSet["uprc"] = buyPrice;
            set["qty"] = 1;
          }

          if (aSellQty && aSellPrice && costs && aSellQty > 0) {
            spotterSet["a_uprc"] = roundToTwoDecimals(aSellPrice / aSellQty);

            const factor = aSellQty / buyQty;
            const arbitrage = calculateAznArbitrage(
              buyPrice * factor, // prc * (a_qty / qty), // EK
              aSellPrice, // a_prc, // VK
              costs,
              tax
            );
            Object.entries(arbitrage).forEach(([key, value]) => {
              spotterSet[key] = value;
            });
          }

          if (
            eSellQty &&
            eSellPrice &&
            ebyCategories &&
            ebyCategories?.length > 0 &&
            eSellQty > 0
          ) {
            spotterSet["e_uprc"] = roundToTwoDecimals(eSellPrice / eSellQty);
            const mappedCategories = findMappedCategory(
              ebyCategories.reduce((acc, curr) => {
                acc.push(curr.id);
                return acc;
              }, [])
            );
            const factor = eSellQty / buyQty;
            if (mappedCategories) {
              const arbitrage = calculateEbyArbitrage(
                mappedCategories,
                eSellPrice, //VK
                buyPrice * factor // prc * (e_qty / qty) //EK  //QTY Zielshop/QTY Herkunftsshop
              );
              if (arbitrage)
                Object.entries(arbitrage).forEach(([key, value]) => {
                  spotterSet[key] = value;
                });
            }
          }

          let spotterBulk = {
            updateOne: {
              filter: { _id: p._id },
              update: { $set: { ...set, ...spotterSet } },
            },
          };
          if (p._id.toString() === "6685ee39d63905fe52c0ff54") {
            console.log("p:", JSON.stringify(spotterBulk, null, 2));
          }
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

migrationLivePackage().then((r) => {
  process.exit(0);
});
