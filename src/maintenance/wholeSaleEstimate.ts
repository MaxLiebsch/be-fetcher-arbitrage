import { getCrawlDataCollection, getProductsCol } from '../db/mongo';
import pkg from 'fs-jetpack';
const { write } = pkg;

const main = async () => {
  const col = await getProductsCol();
  const wholesaleBatch = await col
    .find({
      taskIds: '677e53972914f3b39a1234fa',
    })
    .toArray();
  const asineans = await getCrawlDataCollection('asinean');
  console.log('wholesaleBatch:', wholesaleBatch.length);
  //@ts-ignore
  const eans = wholesaleBatch.map((product) => product.eanList[0]);
  write(
    'C:\\Users\\love\\Documents\\Projekts\\Arbitrage\\collections\\wholesale\\input.json',
    wholesaleBatch.map((product) => {
      product["a_locked"] = false
      delete product.a_status;
      product.a_lookup_pending = true;
      return product;``
    })
  );

  //   const count = await col.countDocuments({
  //     eanList: { $in: eans },
  //     a_pblsh: true,
  //   });
  //   console.log('count:', count);
  const count = await asineans
    .aggregate([
      {
        $match: {
          $and: [
            {
              eans: { $in: eans },
            },
            { asin: { $exists: true, $ne: null } },
          ],
        },
      },
      { $group: { _id: '$eans', doc: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$doc' } },
    ])
    .toArray();
  write('C:\\Users\\love\\Documents\\Projekts\\Arbitrage\\collections\\wholesale\\asineans.json', count);
  console.log('count:', count.length);
  const list = await col
    .aggregate([
      {
        $match: {
          eanList: { $in: eans },
          a_pblsh: true,
          asin: { $exists: true, $ne: null },
          taskIds: { $exists: false },
        },
      },
      { $group: { _id: '$eanList', doc: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$doc' } },
    ])
    .toArray();
  console.log('list:', list.length);
  write(
    'C:\\Users\\love\\Documents\\Projekts\\Arbitrage\\collections\\wholesale\\existing.json',
    list
  );
};

main().then(() => {
  console.log('done');
});
