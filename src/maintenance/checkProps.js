import {
  findArbispotterProducts,
} from "../db/util/crudArbispotterProduct.js";
import { getActiveShops } from "../db/util/shops.js";

const updateAznUpdatedAt = async () => {
  const activeShops = await getActiveShops();

  for (const shop of Object.values(activeShops)) {
    let hasMoreProducts = true;
    const batchSize = 2000;
    while (hasMoreProducts) {
      const products = await findArbispotterProducts(
        shop.d,
        {
          $and: [{ info_taskId: { $exists: true } }],
        },
        batchSize
      );
      if (products.length) {
        console.log(`lookup_info ${products.length} products for ${shop.d}`);
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
