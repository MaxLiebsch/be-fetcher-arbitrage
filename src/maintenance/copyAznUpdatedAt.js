import {
  findArbispotterProducts,
  updateArbispotterProductLinkQuery,
} from "../db/util/crudArbispotterProduct.js";
import { getActiveShops } from "../db/util/shops.js";

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
          aznUpdatedAt: { $exists: true },
          a_prc: { $exists: true },
        },
        batchSize
      );
      if (products.length) {
        await Promise.all(
          products.map((p) => {
            completed++;
            const dataUpdate = {};
            dataUpdate["aznUpdatedAt"] = p.aznUpdatedAt;
            return Promise.all([
              updateArbispotterProductLinkQuery(shop.d, p.lnk, {
                $unset: { aznUpdatedAt: "" },
              }),
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
