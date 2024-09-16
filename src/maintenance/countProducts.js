import { getActiveShops } from "../db/util/shops.js";
import { getArbispotterDb } from "../db/mongo.js";

/**
 * Counts the total number of products across all active shops.
 * @returns {Promise<number>} The total number of products.
 */
let total = 0;

export const countTotal = async () => {
  const activeShops = await getActiveShops();
  const spotterdb = await getArbispotterDb();
  await Promise.all(
    activeShops.map(async (shop) => {
      const shopcol = spotterdb.collection(shop.d);
      const cnt = await shopcol.countDocuments({});
      total += cnt;
    })
  );
  return total;
};

// countTotal().then(async (r) => {
//   console.log('r:', r)
//   process.exit(0);
// });
