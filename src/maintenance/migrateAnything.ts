import { DbProductRecord } from '@dipmaxtech/clr-pkg';
import { getProductsCol } from '../db/mongo';
import { ObjectId } from 'mongodb';

const query = { _id: { $type: 'string' } };

let countFalsePositives = 0;

async function migrateAnything() {
  const col = await getProductsCol();
  let total = await col.countDocuments(query);
  console.log('total:', total);

  const batch = 2000;
  let cnt = 0;
  let hasMore = true;
  while (hasMore && cnt <= total) {
    console.log('cnt <= total:', cnt <= total);
    const bulks: any = [];
    // @ts-ignore
    const products = await col.find(query).limit(batch).toArray();
    if (products.length > 0) {
      const deleted = await col.bulkWrite(
        products.map((p: any) => {
          return {
            deleteOne: {
              filter: { _id: p._id },
            },
          };
        })
      );
      console.log('deleted:', deleted.deletedCount);
    }
    for (const product of products) {
      let spotterSet: Partial<DbProductRecord> = {};
      if (typeof product._id === 'string') {
        //@ts-ignore
        product._id = new ObjectId(product._id as string);
        //@ts-ignore
        spotterSet._id = new ObjectId(product._id as string);
      }

      if (Object.keys(spotterSet).length > 0) {
        const update = {
          $set: { ...spotterSet },
        };
        bulks.push({
          insertOne: { document: product },
        });
      }
    }

    if (bulks.length > 0) {
      const result = await col.bulkWrite(bulks);
      console.log(
        `Bulk write result: ${result.insertedCount}/${products.length} products migrated.`
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
