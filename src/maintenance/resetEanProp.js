import { getArbispotterDb, getCrawlDataDb } from "../db/mongo.js";
import { getAllShopsAsArray } from "../db/util/shops.js";

const resetEanProp = async () => {
  const spotter = await getArbispotterDb();
  const shops = await getAllShopsAsArray();
  const activeShops = shops.filter((shop) => shop.active);
  activeShops.push({d: 'sales'})

  for (let index = 0; index < activeShops.length; index++) {
    const shop = activeShops[index];
    const result = await spotter
    .collection(shop.d)
    .updateMany(
      // { eanList: { $elemMatch: { $eq: null }}, ean_taskId: {$exists: false} } ,
      {},
      { $unset: { ean_prop: "", eanList: "", ean_taskId: "", ean: "", ean_locked: "",eanUpdatedAt: "" } }
    );
    console.log('result:', result)
  }
};

resetEanProp().then((r) => {
  process.exit(0);
});
