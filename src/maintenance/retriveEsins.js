import { findArbispotterProducts } from "../db/util/crudArbispotterProduct.js";
import { getActiveShops } from "../db/util/shops.js";

const checkProps = async () => {
  const activeShops = await getActiveShops();

  for (const shop of Object.values(activeShops)) {
    const batchSize = 2000;
    const products = await findArbispotterProducts(
      shop.d,
      { info_taskId: { $exists: true } },
      batchSize
    );
    if (products.length) {
      console.log(`lookup_info ${products.length} products for ${shop.d}`);
    } else {
      console.log(`No updates needed in shop ${shop.d}`);
    }
  }
};

checkProps().then((r) => {
  process.exit(0);
});
