import { DbProductRecord, recalculateAznMargin } from '@dipmaxtech/clr-pkg';
import { getProductsCol } from '../db/mongo';

const query = {
  $or: [
    { 'costs.prvsn': { $exists: true } },
    // { 'costs.azn': { $exists: true } },
  ],
  a_mrgn: { $gt: 0 },
};

// const query = {
//     $and: [
//       {sdmn: "voelkner.de"},
//       {asin: "B079Q4QP4Z"},
//     ]
  
//   };
  
let countFalsePositives = 0;

async function migrateAnything() {
  const col = await getProductsCol();
  let total = await col.countDocuments(query);
  console.log('total:', total);

  const batch = 2000;
  let cnt = 0;
  while (cnt < total) {
    const bulks: any = [];
    const products = await col.find(query).limit(batch).skip(cnt).toArray();

    for (const product of products) {
      let spotterSet: Partial<DbProductRecord> = {};
      if (!product.a_qty) {
        product.a_qty = 1;
        spotterSet['a_qty'] = 1;
      }
      if(!product.qty){
        product.qty = 1;
        spotterSet['qty'] = 1;
      }
      recalculateAznMargin(product, product.a_prc!, spotterSet);
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
