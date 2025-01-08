import { DbProductRecord, getAznAvgPrice } from '@dipmaxtech/clr-pkg';
import { getProductsCol } from '../db/mongo';
import { recalculateEbyMargin } from '../util/recalculateEbyMargin';

const query = {
  e_pblsh: true,
  e_mrgn: { $gt: 0 },
  'e_pRange.median': { $exists: true },
};

let countFalsePositives = 0;

async function migrateAnything() {
  const col = await getProductsCol();
  let total = await col.countDocuments(query);
  console.log('total:', total);

  const batch = 1000;
  let cnt = 0;
  let hasMore = true;
  while (hasMore && cnt <= total) {
    console.log('cnt <= total:', cnt <= total);
    const bulks: any = [];
    const products = await col.find(query).limit(batch).skip(cnt).toArray();

    for (const product of products) {
      const { lnk } = product;
      let spotterSet: Partial<DbProductRecord> = {};
      recalculateEbyMargin(product, spotterSet);

      if (Object.keys(spotterSet).length > 0) {
        const update = {
          $set: { ...spotterSet },
        };
        bulks.push({ updateOne: { filter: { _id: product._id }, update } });
      }
    }

    if (bulks.length > 0) {
      const result = await col.bulkWrite(bulks);
      console.log(
        `Bulk write result: ${result.modifiedCount}/${result.matchedCount}`
      );
    }
    if (products.length === 0) {
      break;
    }

    cnt += products.length;
    hasMore = products.length === batch;
    console.log(`Processed ${cnt}/${total}`);
  }
}

migrateAnything().then(() => {
  console.log(
    'done migration',
    'Margin Calculation was wrong',
    countFalsePositives
  );
  process.exit(0);
});
