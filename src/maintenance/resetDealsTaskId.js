import { getArbispotterDb, getCrawlDataDb } from "../services/db/mongo.js";
import { getAllShopsAsArray } from "../services/db/util/shops.js";

const resetDealTaskId = async () => {
  const spotter = await getArbispotterDb();
  const shops = await getAllShopsAsArray();
  const activeShops = shops.filter((shop) => shop.active);

  for (let index = 0; index < activeShops.length; index++) {
    const shop = activeShops[index];
    await spotter
      .collection(shop.d)
      .updateMany({}, { $unset: { dealAznTaskId: "", dealEbyTaskId: "" } });
  }
};

resetDealTaskId().then((r) => {
  process.exit(0);
});
