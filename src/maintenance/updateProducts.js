import { activeShops } from "../src/constants.js";
import { getArbispotterDb } from "../src/service/db/mongo.js";
import { createHash } from "../src/util/hash.js";

const main = async () => {
  return await Promise.all(
    activeShops.map(async (shopDomain) => {
      const collectionName = shopDomain;
      const db = await getArbispotterDb();
      const collection = db.collection(collectionName);

      const cursor = collection.find({});
      while (await cursor.hasNext()) {
        const doc = await cursor.next();
        let a_hash = null;
        let e_hash = null;
        let a_vrfd = null;
        let e_vrfd = null;
        if (doc.a_lnk) {
          a_hash = createHash(doc.a_lnk);
          a_vrfd = {
            vrfd: false,
            vrfn_pending: true,
            flags: [],
            flag_cnt: 0,
          };
        }
        if (doc.e_lnk) {
        
          e_hash = createHash(doc.e_lnk);
          e_vrfd = {
            vrfd: false,
            vrfn_pending: true,
            flags: [],
            flag_cnt: 0,
          };
        }
    
        await collection.updateMany(
          { _id: doc._id },
          { $set: { e_hash, a_hash, a_vrfd, e_vrfd } }
        );
      }
    })
  );
};

main().then(() => process.exit(0));
