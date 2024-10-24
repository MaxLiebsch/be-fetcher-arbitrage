import { getProductsCol } from '../db/mongo';

async function migrateCyberport() {
  const col = await getProductsCol();
  const total = await col.countDocuments({ sdmn: 'cyberport.de' });

  const batch = 1000;
  let cnt = 0;
  while (cnt < total) {
    const bulks: any = [];
    const products = await col
      .find({ sdmn: 'cyberport.de' })
      .limit(batch)
      .skip(cnt)
      .toArray();

    for (const product of products) {
      const { _id: productId, esin, asin } = product;
      const update: any = {
        updateOne: {
          filter: { _id: productId },
          update: {
            $set: {},
            $unset: {
              taskId: '',
              matched: '',
              matchedAt: '',
            },
          },
        },
      };
      if (esin) {
        update.updateOne.update.$set['eby_prop'] = 'complete';
      }
      if (asin) {
        update.updateOne.update.$set['azn_prop'] = 'complete';
      }
      bulks.push(update);
    }
    if (bulks.length > 0) {
      const result = await col.bulkWrite(bulks);
      console.log(
        `Bulk write result: ${result.modifiedCount}/${result.matchedCount}`,
      );
    }
    cnt += products.length;
    console.log(`Processed ${cnt}/${total}`);
  }
}

migrateCyberport().then(() => {
  console.log('done migration');
  process.exit(0);
});
