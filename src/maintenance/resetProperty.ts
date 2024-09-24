//@ts-nocheck
import { getArbispotterDb } from "../db/mongo";
import {
  getActiveShops,
  getAllShops,
  getAllShopsAsArray,
} from "../db/util/shops";

export const resetProperty = async (query) => {
  const spotter = await getArbispotterDb();
  const shops = await getActiveShops();
  const activeShops = shops.filter((shop) => shop.active);
  console.log(
    "activeShops:",
    activeShops.map((s) => s.d)
  );

  for (let index = 0; index < activeShops.length; index++) {
    const shop = activeShops[index];
    const result = await spotter.collection(shop.d).updateMany(
      {
        $or: [
          { eby_prop: { $in: ["complete"] } },
          // { cat_prop: "ean_missmatch" },
        ],
      },
      query
    );
    console.log(shop.d, "result:", result);
  }
};

resetProperty({
  $unset: {
    eby_prop: "",
    // cat_prop: "",
  },
}).then((r) => {
  process.exit(0);
});
