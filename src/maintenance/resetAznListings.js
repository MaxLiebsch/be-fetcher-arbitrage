import { getCrawlDataDb } from "../services/db/mongo.js";
import { getShop } from "../services/db/util/shops.js";
import { subDateDaysISO } from "../util/dates.js";

const main = async () => {
  const shop = await getShop("alternate.de");

  if (!shop) return "Shop not found";

  const db = await getCrawlDataDb();

  const collectionName = shop.d;
  const query = {
    asin: { $exists: true },
  };

  const update = {
    $set: {
      aznUpdatedAt: subDateDaysISO(10),
      azn_taskId: ""
    },
  };

  return await db.collection(collectionName).updateMany(query, update);
};

main().then((r) => {
  console.log(r);
  process.exit(0);
});
