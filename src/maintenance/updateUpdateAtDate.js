import {
  findCrawlDataProducts,
  updateCrawlDataProduct,
} from "../services/db/util/crudCrawlDataProduct.js";
import { getActiveShops } from "../services/db/util/shops.js";
import { subDateDaysISO } from "../util/dates.js";

const updateAznUpdatedAt = async () => {
  const activeShops = await getActiveShops();

  for (const shop of Object.values(activeShops)) {
    let hasMoreProducts = true;
    const batchSize = 500;
    let completed = 0;
    while (hasMoreProducts) {
      const products = await findCrawlDataProducts(
        shop.d,
        {
          aznUpdatedAt: { $exists: true },
          ebyUpdatedAt: { $exists: true},
        },
        batchSize
      );
      if (products.length) {
        await Promise.all(
          products.map((p) => {
            completed++;
            const update = {};
            if (p.aznUpdatedAt) {
              update["aznUpdatedAt"] = subDateDaysISO(10);
            }
            if (p.ebyUpdatedAt) {
              update["ebyUpdatedAt"] = subDateDaysISO(10);
            }
            return updateCrawlDataProduct(shop.d, p.link, update);
          })
        );
        console.log(
          `Updated aznUpdatedAt in ${completed} products for ${shop.d}`
        );
      } else {
        console.log(`No updates needed in shop ${shop.d}`);
      }
      hasMoreProducts = products.length === batchSize;
    }
  }
};

updateAznUpdatedAt().then((r) => {
  process.exit(0);
});
