import { getArbispotterDb, getCrawlDataDb } from "../services/db/mongo.js";
import { getAllShopsAsArray } from "../services/db/util/shops.js";

const resetProperty = async () => {
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
      { dealAznTaskId: 'clr2:66c76dee5c74f136b98af654'},
      { $unset: { dealAznTaskId: "" } }
    );
    console.log('result:', result)
  }
};

resetProperty().then((r) => {
  process.exit(0);
});
