import { getArbispotterDb } from "../db/mongo.js";
import { findProducts } from "../db/util/crudProducts.js";
import { getActiveShops } from "../db/util/shops.js";
import { findTask } from "../db/util/tasks.js";

const deleteQueryEansResults = async () => {
  const spotter = await getArbispotterDb();
  const shops = await getActiveShops();
  const qtyTask = await findTask({
    //@ts-ignore
    type: "DETECT_QUANTITY",
  });
  if (!qtyTask) return;
  const nmTask = await findTask({
    //@ts-ignore
    type: "MATCH_TITLES",
  });
  if (!nmTask) return;

  if (!shops) return;

  const qtyBatchId =
    //@ts-ignore
    qtyTask.batches.length > 0 ? qtyTask.batches[0].batchId : null;

  const nmBatchId =
    //@ts-ignore
    nmTask.batches.length > 0 ? nmTask.batches[0].batchId : null;

  const query: any = {
    $or: [],
  };

  if (qtyBatchId) {
    query.$or.push({
      qty_prop: "in_progress",
      qty_batchId: { $ne: qtyBatchId },
    });
  } else {
    query.$or.push({
      qty_prop: "in_progress",
      qty_batchId: { $exists: true },
    });
  }

  if (nmBatchId) {
    query.$or.push({ nm_prop: "in_progress", nm_batchId: { $ne: nmBatchId } });
  } else {
    query.$or.push({ nm_prop: "in_progress", nm_batchId: { $exists: true } });
  }
  console.log("query:", JSON.stringify(query, null, 2));

  const activeShops = shops.filter((shop) => shop.active);

  for (let index = 0; index < activeShops.length; index++) {
    const shop = activeShops[index];
    const total = await spotter.collection(shop.d).countDocuments(query);

    console.log("Processing shop:", shop.d, "total:", total);
    let cnt = 0;
    let count = 0;
    const batchSize = 200;
    let completed = false;
    while (!completed) {
      const spotterBulkWrites: any[] = [];
      const products = await findProducts(
        { sdmn: shop.d, ...query },
        batchSize
      );
      if (products.length) {
        products.map((p) => {
          count++;

          const { qty_prop, nm_prop, qty_batchId, nm_batchId } = p;

          let spotterBulk: {
            updateOne: {
              filter: any;
              update: any;
            };
          } = {
            updateOne: {
              filter: { _id: p._id },
              update: { $unset: {} },
            },
          };
          if (qty_prop === "in_progress" && !qty_batchId) {
            spotterBulk.updateOne.update.$unset.qty_prop = "";
            spotterBulk.updateOne.update.$unset.qty_v = "";
          }
          if (qty_prop === "in_progress" && qty_batchId !== qtyBatchId) {
            spotterBulk.updateOne.update.$unset.qty_prop = "";
            spotterBulk.updateOne.update.$unset.qty_batchId = "";
            spotterBulk.updateOne.update.$unset.qty_v = "";
          }

          if (nm_prop === "in_progress" && !nm_batchId) {
            spotterBulk.updateOne.update.$unset.nm_prop = "";
            spotterBulk.updateOne.update.$unset.nm_v = "";
          }

          if (nm_prop === "in_progress" && nm_batchId !== nmBatchId) {
            spotterBulk.updateOne.update.$unset.nm_prop = "";
            spotterBulk.updateOne.update.$unset.nm_batchId = "";
            spotterBulk.updateOne.update.$unset.nm_v = "";
          }

          spotterBulkWrites.push(spotterBulk);
        });
        await spotter.collection(shop.d).bulkWrite(spotterBulkWrites);
      } else {
        completed = true;
        console.log(`Done ${shop.d}`);
      }

      console.log("Processing batch:", cnt, "count:", count);
      cnt++;
    }
  }
};

deleteQueryEansResults().then((r) => {
  process.exit(0);
});
