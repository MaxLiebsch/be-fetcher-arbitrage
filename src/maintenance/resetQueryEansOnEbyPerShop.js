import { getCrawlDataDb } from "../db/mongo.js";
import { getShop } from "../db/util/shops.js";

const main = async () => {
  const shop = await getShop("alza.de");

  if (!shop) return "Shop not found";

  const db = await getCrawlDataDb();

  const collectionName = shop.d;
  const query = {};

  const update = {
    $set: {
      eby_prop: "",
      eby_locked: false,
    },
  };

  return await db.collection(collectionName).updateMany(query, update);
};

main().then((r) => {
  console.log(r);
  process.exit(0);
});
