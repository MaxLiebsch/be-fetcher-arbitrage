import { getCrawlDataDb } from "../db/mongo.js";
import { getShop } from "../db/util/shops.js";
import { subDateDaysISO } from "../util/dates.js";

const main = async () => {
  const shop = await getShop("alternate.de");

  if (!shop) return "Shop not found";

  const db = await getCrawlDataDb();

  const collectionName = shop.d;
  const query = {
    esin: { $exists: true },
  };

  const update = {
    $set: {
      ebyUpdatedAt: subDateDaysISO(10),
      eby_locked: false,
      eby_taskId: "",
    },
  };

  return await db.collection(collectionName).updateMany(query, update);
};

main().then((r) => {
  console.log(r);
  process.exit(0);
});
