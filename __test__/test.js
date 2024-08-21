import { getArbispotterDb } from "../src/services/db/mongo.js";
import {
  aggregation,
  countPendingProductsUpdateProductinfoQuery,
  countTotalProductsForUpdateProductinfoQuery,
  lockProductsForUpdateProductinfoQuery,
} from "../src/services/db/util/queries.js";
import { getOutdatedUpdateProductinfoShops } from "../src/services/db/util/updateProductinfo/getOutdatedUpdateProductinfoShops.js";

// const test = lockProductsForUpdateProductinfoQuery();
// console.log("test:", JSON.stringify(test, null, 2));

// console.log(
//   "countPendingProductsUpdateProductinfoQuery",
//   JSON.stringify(countPendingProductsUpdateProductinfoQuery, null, 2)
// );

// console.log(
//   "countTotalProductsForUpdateProductinfoQuery",
//   JSON.stringify(countTotalProductsForUpdateProductinfoQuery, null, 2)
// );

// getOutdatedUpdateProductinfoShops().then((r) =>
//   {r.map((s) => console.log({ shop: s.shop.d, pending: s.pending }))
//    console.log('Total', r.reduce((acc, { pending }) => acc + pending, 0))

// }
// );

console.log('agg', JSON.stringify(aggregation, null, 2))

const test = async () => {
  const db = await getArbispotterDb();
  const idealo = db.collection("idealo.de");

  const counts = await idealo.aggregate(aggregation).toArray()
  if(counts.length === 1) {
    console.log(counts[0].totalEbay.total)
  }
};

test().then(() => console.log("done"));
