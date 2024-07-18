import { getArbispotterDb, getCrawlDataDb } from "../services/db/mongo.js";
import { findArbispotterProducts } from "../services/db/util/crudArbispotterProduct.js";
import { getAllShopsAsArray } from "../services/db/util/shops.js";
import {
  calculateAznArbitrage,
  calculateEbyArbitrage,
  detectQuantity,
  findMappedCategory,
  roundToTwoDecimals,
} from "@dipmaxtech/clr-pkg";
import { countTotal } from "./countProducts.js";

const migrationPackage = async () => {
  const crawlData = await getCrawlDataDb();
  const spotter = await getArbispotterDb();
  const shops = await getAllShopsAsArray();
  const activeShops = shops.filter(
    (shop) => shop.active 
  );

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
      const crawlDataBulkWrites = [];
      const products = await findArbispotterProducts(
        shop.d,
        {},
        batchSize,
        cnt
      );
      if (products.length) {
        products.map((p) => {
          count++;
          const set = {};
          const spotterSet = {};
          const crawlDataSet = {};
          const qty = detectQuantity(p.nm);
          if (qty) {
            p.qty = qty;
          } else {
            p.qty = 1;
          }

          if (p.a_qty !== undefined && p.a_qty === 0) {
            p.a_qty = 1;
          }
          if (p.e_qty !== undefined && p.e_qty === 0) {
            p.e_qty = 1;
          }
          if (p.qty !== undefined && p.qty === 0) {
            p.qty = 1;
          }
          
          if (p.ebyCategories && p.e_nm) {
            let mappedCategory = null;
            if (p.ebyCategories.every((cat) => typeof cat === "number")) {
              mappedCategory = findMappedCategory(p.ebyCategories); // { category: "Drogerie", id: 322323, ...}
            } else if (p.ebyCategories.length > 0) {
              mappedCategory = findMappedCategory([p.ebyCategories[0].id]);
            }
            if (mappedCategory) {
              const qty = detectQuantity(p.e_nm);

              if (qty) {
                p.e_qty = qty;
              } else {
                p.e_qty = 1;
              }

              const {
                prc: buyPrice,
                qty: buyQty,
                e_qty: sellQty,
                e_prc: sellPrice,
              } = p;

              spotterSet["e_uprc"] = roundToTwoDecimals(sellPrice / sellQty);
              let ebyArbitrage = calculateEbyArbitrage(
                mappedCategory,
                sellPrice, //VK
                buyPrice * (sellQty / buyQty) //EK  //QTY Zielshop/QTY Herkunftsshop
              );
              if (ebyArbitrage) {
                Object.entries(ebyArbitrage).forEach(([key, val]) => {
                  spotterSet[key] = val;
                });
              }
              set["ebyCategories"] = [
                {
                  id: mappedCategory.id,
                  createdAt: new Date().toISOString(),
                  category: mappedCategory.category,
                },
              ];
            }
          }
          if (p.costs && p.a_nm) {
            const qty = detectQuantity(p.a_nm);
            if (qty) {
              p.a_qty = qty;
            } else {
              p.a_qty = 1;
            }

            const {
              prc: buyPrice,
              qty: buyQty,
              a_qty: sellQty,
              a_prc: sellPrice,
              costs,
              tax,
            } = p;

            spotterSet["a_uprc"] = roundToTwoDecimals(sellPrice / sellQty);

            const arbitrage = calculateAznArbitrage(
              buyPrice * (sellQty / buyQty), // EK
              sellPrice, // VK
              costs,
              tax
            );
            Object.entries(arbitrage).forEach(([key, val]) => {
              spotterSet[key] = val;
            });
          }

          set["qty"] = p.qty;
          set["a_qty"] = p.a_qty;
          set["e_qty"] = p.e_qty;


          let spotterBulk = {
            updateOne: {
              filter: { _id: p._id },
              update: { $set: { ...set, ...spotterSet } },
            },
          };
          let crawlDataBulk = {
            updateOne: {
              filter: { link: p.lnk },
              update: { $set: { ...set, ...crawlDataSet } },
            },
          };
          spotterBulkWrites.push(spotterBulk);
          crawlDataBulkWrites.push(crawlDataBulk);
        });
        await Promise.all([
          spotter.collection(shop.d).bulkWrite(spotterBulkWrites),
          crawlData.collection(shop.d).bulkWrite(crawlDataBulkWrites),
        ]);
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

migrationPackage().then((r) => {
  process.exit(0);
});
