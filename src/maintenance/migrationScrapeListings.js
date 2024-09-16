import { getArbispotterDb, getCrawlDataDb } from "../db/mongo.js";
import { findCrawlDataProducts } from "../db/util/crudCrawlDataProduct.js";
import { getAllShopsAsArray } from "../db/util/shops.js";

const migrationScrapeListings = async () => {
  const spotter = await getArbispotterDb();
  const crawlData = await getCrawlDataDb();
  const shops = await getAllShopsAsArray();
  const activeShops = shops!.filter(
    (shop) => shop.active
  );

  let count = 0;
  for (let index = 0; index < activeShops.length; index++) {
    const shop = activeShops[index];

    console.log("Processing shop:", shop.d);
    let cnt = 0;
    const batchSize = 250;
    let hasMoreProducts = true;
    while (hasMoreProducts) {
      const products = await findCrawlDataProducts(
        shop.d,
        {
          $or: [
            { ebyUpdatedAt: { $exists: true } },
            { aznUpdatedAt: { $exists: true } },
          ],
        },
        batchSize
      );
      console.log(
        `Processing batch: ${cnt} Skip: ${
          cnt * batchSize
        } Limit: ${batchSize} hasMoreProducts: ${products.length === batchSize} batchProductCount: ${products.length})`
      );
      if (products.length) {
        const spotterBulkWrites = [];
        const crawlDataBulkWrites = [];
        products.map((p) => {
          count++;
          const spotterSet = {};

          if (p.ebyUpdatedAt) {
            spotterSet["ebyUpdatedAt"] = p.ebyUpdatedAt;
          }

          if (p.aznUpdatedAt) {
            spotterSet["aznUpdatedAt"] = p.aznUpdatedAt;
          }

          const crawlDataUnset = {
            ebyUpdatedAt: "",
            aznUpdatedAt: "",
            azn_locked: "",
            azn_taskId: "",
            eby_taskId: "",
            eby_locked: "",
          };
          let spotterBulk = {
            updateOne: {
              filter: { s_hash: p.s_hash },
              update: { $set: { ...spotterSet } },
            },
          };
          let crawlDataBulk = {
            updateOne: {
              filter: { _id: p._id },
              update: { $unset: { ...crawlDataUnset } },
            },
          };
          crawlDataBulkWrites.push(crawlDataBulk);
          spotterBulkWrites.push(spotterBulk);
        });
        await spotter.collection(shop.d).bulkWrite(spotterBulkWrites);
        await crawlData.collection(shop.d).bulkWrite(crawlDataBulkWrites);
      } else {
        console.log(`Done ${shop.d}`);
      }

      hasMoreProducts = products.length === batchSize;  

      cnt++;
    }
  }
};

migrationScrapeListings().then((r) => {
  process.exit(0);
});
