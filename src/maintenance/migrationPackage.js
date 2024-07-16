import {
  createArbispotterCollection,
  createCrawlDataCollection,
  getArbispotterDb,
  getCrawlDataDb,
} from "../services/db/mongo.js";
import {
  countProducts,
  findArbispotterProducts,
} from "../services/db/util/crudArbispotterProduct.js";
import { createOrUpdateArbispotterProduct } from "../services/db/util/createOrUpdateArbispotterProduct.js";
import { getAllShopsAsArray } from "../services/db/util/shops.js";
import {
  calculateAznArbitrage,
  calculateEbyArbitrage,
  detectQuantity,
  findMappedCategory,
  roundToTwoDecimals,
} from "@dipmaxtech/clr-pkg";
import { parseAsinFromUrl } from "../util/parseAsin.js";
import { parseEsinFromUrl } from "../util/parseEsin.js";
import { createHash } from "../util/hash.js";
import { countTotal } from "./countProducts.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const cleanSlate = async () => {
  const crawlData = await getCrawlDataDb();
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
          set["qty"] = 1;
          set["uprc"] = p.prc;
          spotterSet["s_hash"] = createHash(p.lnk);
          if (p.ebyCategories && p.e_nm) {
            const esin = parseEsinFromUrl(p.e_lnk);
            if (esin) {
              set["esin"] = esin;
              spotterSet["esin"] = esin;
              spotterSet["e_lnk"] = p.e_lnk.split("?")[0];
              spotterSet["e_hash"] = createHash(p.e_lnk.split("?")[0]);
              set["e_qty"] = 1;
              spotterSet["e_uprc"] = p.e_prc;
            }
            let mappedCategory = findMappedCategory(p.ebyCategories); // { category: "Drogerie", id: 322323, ...}
            if (mappedCategory) {
              let ebyArbitrage = calculateEbyArbitrage(
                mappedCategory,
                spotterSet["e_uprc"],
                set["uprc"]
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
            const asin = parseAsinFromUrl(p.a_lnk);
            if (asin) {
              set["asin"] = asin;
              spotterSet["asin"] = asin;
              spotterSet["a_lnk"] = p.a_lnk.split("?")[0];
              spotterSet["a_hash"] = createHash(p.a_lnk.split("?")[0]);
              set["a_qty"] = 1;
              spotterSet["a_uprc"] = p.a_prc;
            }
            const arbitrage = calculateAznArbitrage(
              set["uprc"],
              spotterSet["a_uprc"],
              p.costs,
              p.tax
            );
            Object.entries(arbitrage).forEach(([key, val]) => {
              spotterSet[key] = val;
            });
          }
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

cleanSlate().then((r) => {
  process.exit(0);
});
