import { getArbispotterDb, getProductsCol } from '../db/mongo.js';
import { getActiveShops, getAllShopsAsArray } from '../db/util/shops.js';
import { calculateMonthlySales } from '@dipmaxtech/clr-pkg';
import { countTotal } from './countProducts.js';

const query = (sdmn: string) => {
  return {
    $and: [
      { sdmn },
      { categories: { $exists: true, $ne: null } },
      { salesRanks: { $exists: true, $ne: null } },
      { categoryTree: { $exists: true, $ne: null } },
    ],
  };
};

const migrationMonthlySold = async () => {
  const shops = await getActiveShops();
  const col = await getProductsCol();

  if (!shops) return;

  const activeShops = shops.filter((shop) => shop.active);

  let count = 0;

  for (let index = 0; index < activeShops.length; index++) {
    const shop = activeShops[index];
    const total = await col.countDocuments(query(shop.d));
    console.log('Processing shop:', shop.d);
    let cnt = 0;
    const batchSize = 250;
    while (cnt < total) {
      const spotterBulkWrites: any = [];
      const products = await col
        .find(query(shop.d), { limit: batchSize, skip: cnt })
        .toArray();
      if (products.length) {
        products.map((p) => {
          count++;
          const set: any = {};
          const unset: any = {};

          if (p.categories && p.salesRanks && p.categoryTree) {
            const monthlySold = calculateMonthlySales(
              p.categories,
              p.salesRanks,
              p.categoryTree
            );
            if (monthlySold) {
              set['monthlySold'] = monthlySold;
            } else {
              unset['monthlySold'] = '';
            }
          }

          let spotterBulk: any = {
            updateOne: {
              filter: { _id: p._id },
              update: { $set: { ...set } },
            },
          };

          if (Object.keys(unset).length) {
            spotterBulk.updateOne.update['$unset'] = { ...unset };
          }

          p.asin === 'B001EBWLME' && console.log('spotterBulk', spotterBulk);
          spotterBulkWrites.push(spotterBulk);
        });
        if (spotterBulkWrites.length) await col.bulkWrite(spotterBulkWrites);
      } else {
        console.log(`Done ${shop.d}`);
      }

      console.log(
        'Processing batch:',
        cnt,
        'count:',
        total,
        'hasMoreProducts: ',
        products.length === batchSize
      );
      cnt += products.length;
    }
  }
};

migrationMonthlySold().then((r) => {
  process.exit(0);
});
