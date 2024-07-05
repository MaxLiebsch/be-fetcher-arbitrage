import {
  findArbispotterProducts,
  updateArbispotterProduct,
} from "../services/db/util/crudArbispotterProduct.js";
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
      const products = await findArbispotterProducts(
        shop.d,
        {
          $and: [
            {
              e_lnk: { $exists: true, $ne: "" },
            },
            {
              esin: { $exists: false },
            },
          ],
        },
        batchSize
      );
      if (products.length) {
        await Promise.all(
          products.map((p) => {
            completed++;
            const spotterUpdate = {};
            const dataUpdate = {};
            const esin = new URL(p.e_lnk).pathname.split("/")[2];
            spotterUpdate["esin"] = esin;
            spotterUpdate["e_pblsh"] = false;

            dataUpdate["esin"] = esin;
            dataUpdate["eby_prop"] = "complete";
            dataUpdate["ebyUpdatedAt"] = p.updatedAt;

            return Promise.all([
              updateArbispotterProduct(shop.d, p.lnk, spotterUpdate),
              updateCrawlDataProduct(shop.d, p.lnk, dataUpdate),
            ]);
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
