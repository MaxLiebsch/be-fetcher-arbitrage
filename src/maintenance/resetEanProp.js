import { getArbispotterDb, getCrawlDataDb } from "../services/db/mongo.js";
import { getAllShopsAsArray } from "../services/db/util/shops.js";

const resetEanProp = async () => {
  const spotter = await getArbispotterDb();
  const shops = await getAllShopsAsArray();
  const activeShops = shops.filter((shop) => shop.active);

  for (let index = 0; index < activeShops.length; index++) {
    const shop = activeShops[index];
    const result = await spotter
    .collection(shop.d)
    .updateMany(
      { eanList: null, ean: { $exists: false } },
      { $unset: { ean_prop: "", eanList: "" } }
    );
    console.log('result:', result)
  }
};

resetEanProp().then((r) => {
  process.exit(0);
});
