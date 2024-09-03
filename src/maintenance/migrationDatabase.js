import { getArbispotterDb, getCrawlDataDb } from "../services/db/mongo.js";
import { getAllShopsAsArray } from "../services/db/util/shops.js";
import { UTCDate } from "@date-fns/utc";
import { findCrawlDataProducts } from "../services/db/util/crudCrawlDataProduct.js";
import { add } from "date-fns";
import { parseAsinFromUrl } from "../../src/util/parseAsin.js";
import { createHash, verifyHash } from "../util/hash.js";
import { transformProduct } from "@dipmaxtech/clr-pkg";

const migrationPackage = async () => {
  const crawlData = await getCrawlDataDb();
  const spotter = await getArbispotterDb();
  const shops = await getAllShopsAsArray();
  const activeShops = shops.filter((shop) => shop.active);
  activeShops.push({ d: "sales" });
  let total = 0;
  for (let index = 0; index < activeShops.length; index++) {
    let count = 0;
    const shop = activeShops[index];

    console.log("Processing shop:", shop.d);
    let cnt = 0;
    const batchSize = 250;
    let hasMoreProducts = true;
    while (hasMoreProducts) {
      const spotterBulkWrites = [];
      const crawlDataBulkWrites = [];
      const products = await findCrawlDataProducts(
        shop.d,
        {
          $or: [
            {
              migrationCompleted: { $exists: false },
            },
            {
              migrationCompleted: { $ne: "v3" },
            },
          ],
        },
        batchSize
      );
      if (products.length) {
        const result = await Promise.all(
          products.map(async (p) => {
            count++;
            total++;
            const spotterSet = {};
            const crawlDataSet = {
              migrationCompleted: "v3",
              migrationAt: new UTCDate().toISOString(),
            };

            const {
              ean_prop,
              eanUpdatedAt,
              ean_taskId,
              cat_prop,
              cat_taskId,
              catUpdatedAt,
              info_prop,
              infoUpdatedAt,
              info_taskId,
              eby_prop,
              qEbyUpdatedAt,
              eby_taskId,
              azn_taskId,
              s_hash,
              aznUpdatedAt,
              sku,
              mku,
              matched,
              hasMnfctr,
              matchedAt,
              promoPrice,
              updatedAt,
              van,
              link,
            } = p;
            const arbispotterProduct = await spotter
              .collection(shop.d)
              .findOne({
                lnk: link,
              });
            let crawlDataBulk = {
              updateOne: {
                filter: { _id: p._id },
                update: { $set: crawlDataSet },
              },
            };
            if (arbispotterProduct) {
              if (!arbispotterProduct.asin && arbispotterProduct.a_lnk) {
                const asin = parseAsinFromUrl(arbispotterProduct.a_lnk);
                if (asin) {
                  spotterSet.asin = asin;
                }
              }
              // E_HASH
              if (arbispotterProduct.e_hash) {
                if (
                  !verifyHash(
                    arbispotterProduct.e_lnk,
                    arbispotterProduct.e_hash
                  )
                ) {
                  spotterSet.e_hash = createHash(arbispotterProduct.e_lnk);
                }
              } else {
                if (arbispotterProduct.e_lnk) {
                  spotterSet.e_hash = createHash(arbispotterProduct.e_lnk);
                }
              }
              // A_HASH
              if (arbispotterProduct.a_hash) {
                if (
                  !verifyHash(
                    arbispotterProduct.a_lnk,
                    arbispotterProduct.a_hash
                  )
                ) {
                  spotterSet.a_hash = createHash(arbispotterProduct.a_lnk);
                }
              } else {
                if (arbispotterProduct.a_lnk) {
                  spotterSet.a_hash = createHash(arbispotterProduct.a_lnk);
                }
              }
              // S_HASH
              if (arbispotterProduct.s_hash) {
                if (
                  !verifyHash(arbispotterProduct.lnk, arbispotterProduct.s_hash)
                ) {
                  spotterSet.s_hash = createHash(arbispotterProduct.lnk);
                }
              } else {
                spotterSet.s_hash = createHash(arbispotterProduct.lnk);
              }

              if (van) {
                spotterSet.van = van;
              }

              if (promoPrice) {
                spotterSet.promoPrice = promoPrice;
              }

              if (ean_taskId && ean_taskId !== "") {
                spotterSet.ean_taskId = ean_taskId;
              }
              if (cat_taskId && cat_taskId !== "") {
                spotterSet.cat_taskId = cat_taskId;
              }
              if (info_taskId && info_taskId !== "") {
                spotterSet.info_taskId = info_taskId;
              }
              if (eby_taskId && eby_taskId !== "") {
                spotterSet.eby_taskId = eby_taskId;
              }
              if (azn_taskId && azn_taskId !== "") {
                spotterSet.azn_taskId = azn_taskId;
              }

              if (matchedAt) {
                spotterSet.matchedAt = matchedAt;
              }
              if (typeof matched === "boolean") {
                spotterSet.matched = matched;
              }
              if (sku) {
                spotterSet.sku = sku;
              }
              if (mku) {
                spotterSet.mku = mku;
              }
              if (hasMnfctr) {
                spotterSet.hasMnfctr = hasMnfctr;
              }
              if (aznUpdatedAt) {
                spotterSet.infoUpdatedAt = aznUpdatedAt;
                spotterSet.eanUpdatedAt = aznUpdatedAt;
              } else {
                spotterSet.infoUpdatedAt = new UTCDate().toISOString();
                spotterSet.eanUpdatedAt = add(new UTCDate(), {
                  hours: 32,
                }).toISOString();
              }
              if (ean_prop) {
                if (!eanUpdatedAt) {
                  spotterSet.eanUpdatedAt = updatedAt;
                }
                spotterSet.ean_prop = ean_prop;
              }
              if (info_prop) {
                if (!infoUpdatedAt) {
                  spotterSet.infoUpdatedAt = updatedAt;
                }
                spotterSet.info_prop = info_prop;
              }
              if (cat_prop) {
                if (!catUpdatedAt) {
                  spotterSet.catUpdatedAt = updatedAt;
                }
                spotterSet.cat_prop = cat_prop;
              }
              if (eby_prop) {
                if (!qEbyUpdatedAt) {
                  spotterSet.qEbyUpdatedAt = updatedAt;
                }
                spotterSet.eby_prop = eby_prop;
              }

              let spotterBulk = {
                updateOne: {
                  filter: { lnk: link },
                  update: { $set: { ...spotterSet } },
                },
              };
              spotterBulkWrites.push(spotterBulk);
              crawlDataBulkWrites.push(crawlDataBulk);
            } else {
              let transformed = transformProduct(p, shop.d);
              delete transformed._id;
              let spotterBulk = {
                insertOne: {
                  document: transformed,
                },
              };
              spotterBulkWrites.push(spotterBulk);
              crawlDataBulkWrites.push(crawlDataBulk);
            }
          })
        );
        if (result) {
          console.log(
            "writes:",
            spotterBulkWrites.reduce(
              (acc, curr) => (acc += curr.insertOne ? 1 : 0),
              0
            ),
            "updates:",
            spotterBulkWrites.reduce(
              (acc, curr) => (acc += curr.updateOne ? 1 : 0),
              0
            ),
            "crawlData:",
            crawlDataBulkWrites.length
          );
          await Promise.all([
            spotterBulkWrites.length
              ? spotter.collection(shop.d).bulkWrite(spotterBulkWrites)
              : Promise.resolve(),
            crawlDataBulkWrites.length
              ? crawlData.collection(shop.d).bulkWrite(crawlDataBulkWrites)
              : Promise.resolve(),
          ]);
        }
        await new Promise((r) => setTimeout(r, 1000));
      } else {
        console.log(`Done ${shop.d}`);
      }

      console.log(
        "Processing batch:",
        cnt,
        "count:",
        count,
        "hasMoreProducts: ",
        products.length === batchSize,
        "total: ",
        total
      );
      hasMoreProducts = products.length === batchSize;
    }
  }
};

migrationPackage().then((r) => {
  process.exit(0);
});
