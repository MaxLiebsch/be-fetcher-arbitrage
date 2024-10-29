//@ts-nocheck
import { get } from "underscore";
import { getArbispotterDb, getProductsCol } from "../db/mongo";
import {
  getActiveShops,
  getAllShops,
  getAllShopsAsArray,
} from "../db/util/shops";

export const resetProperty = async (query) => {
  const spotter = await getArbispotterDb();
  const productCol = await getProductsCol();
  const shops = await getAllShopsAsArray(); 
  console.log('shops:', shops.length)
  const activeShops = shops.filter((shop) => shop.active);
  console.log(
    "activeShops:",
    activeShops.map((s) => s.d)
  );

  for (let index = 0; index < activeShops.length; index++) {
    const shop = activeShops[index];
    const result = await productCol.updateMany({ sdmn: shop.d }, query);
    console.log(shop.d, "result:", result.modifiedCount);
  }
};

// resetProperty({
//   $unset: {
//     // eby_prop: "",
//     cat_prop: "",
//   },
// }).then((r) => {
//   process.exit(0);
// });
