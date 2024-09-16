import { getArbispotterDb, getCrawlDataDb } from "../db/mongo.js";
import { getAllShopsAsArray } from "../db/util/shops.js";

const resetDealTaskId = async () => {
  const spotter = await getArbispotterDb();
  const shops = await getAllShopsAsArray();
  const activeShops = shops.filter((shop) => shop.active);
  activeShops.push({ d: "sales" });

  for (let index = 0; index < activeShops.length; index++) {
    const shop = activeShops[index];
    console.log("shop:", shop.d);
    await spotter.collection(shop.d).updateMany(
      {},
      {
        $set: {
          updatedAt: "2024-08-30T03:29:54.364Z",
        },
        $unset: {
          dealAznTaskId: "",
          dealEbyTaskId: "",
          eby_taskId: "",
          aznUpdatedAt: "",
          azn_taskId: "",
          ebyUpdatedAt: "",
          dealAznUpdatedAt: "",
          dealEbyUpdatedAt: "",
          availUpdatedAt: "",
        },
      }
    );
  }
};

resetDealTaskId().then((r) => {
  process.exit(0);
});
