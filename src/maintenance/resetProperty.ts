//@ts-nocheck
import { getArbispotterDb } from "../db/mongo";
import { getAllShopsAsArray } from "../db/util/shops";

export const resetProperty = async (query) => {
  const spotter = await getArbispotterDb();
  const shops = await getAllShopsAsArray();
  const activeShops = shops.filter((shop) => shop.active);
  activeShops.push({ d: "sales" });
  console.log(
    "activeShops:",
    activeShops.map((s) => s.d)
  );

  for (let index = 0; index < activeShops.length; index++) {
    const shop = activeShops[index];
    const result = await spotter.collection(shop.d).updateMany({}, query);
    console.log(shop.d, "result:", result);
  }
};

// resetProperty({
//   $unset: {
//     ean_prop: "",
//     ean_taskId: "",
//   },
// }).then((r) => {
//   process.exit(0);
// });
