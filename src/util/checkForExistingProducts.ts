import {
  AnyBulkWriteOperation,
  DbProductRecord,
  ProductFactory,
  recalculateAznMargin,
} from '@dipmaxtech/clr-pkg';
import {
  getCrawlDataCollection,
  getProductsCol,
  hostname,
} from '../db/mongo.js';

const debug = process.env.DEBUG === 'true';

export const checkForExistingAznProducts = async (
  wholeSaleProducts: DbProductRecord[]
) => {
  const col = await getProductsCol();
  const eans = wholeSaleProducts.map((product) => product.eanList[0]);
  const matches = (await col
    .aggregate([
      {
        $match: {
          eanList: { $in: eans },
          a_pblsh: true,
          'costs.azn': { $exists: true, $ne: null, $gt: 0.3 },
          a_prc: { $exists: true, $ne: null, $gt: 1 },
          asin: { $exists: true, $ne: null },
          taskIds: { $exists: false },
        },
      },
      { $group: { _id: '$eanList', doc: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$doc' } },
    ])
    .toArray()) as unknown as DbProductRecord[];

  const productClasses = matches.map((product) => {
    return ProductFactory.createFromApi(product);
  });

  let bulkWrites: AnyBulkWriteOperation<DbProductRecord>[] = [];
  productClasses.forEach((product) => {
    const core = product.getCore();
    const indexToRemove = wholeSaleProducts.findIndex(
      (p) => p.eanList[0] === core.eanList[0]
    );

    if (indexToRemove === -1) return;

    const matchedWholesaleProduct = wholeSaleProducts[indexToRemove];

    const azn = product.getAzn();

    recalculateAznMargin(
      { ...matchedWholesaleProduct, ...azn },
      azn.a_prc!,
      azn
    );

    bulkWrites.push({
      updateOne: {
        filter: { _id: matchedWholesaleProduct._id },
        update: {
          $set: {
            ...azn,
            a_lookup_pending: false,
            a_status: 'complete',
            a_locked: false,
          },
          $pull: { clrName: hostname },
        },
      },
    });
    wholeSaleProducts.splice(indexToRemove, 1);
  });

  if (bulkWrites.length) {
    await col.bulkWrite(bulkWrites);
  }

  if (wholeSaleProducts.length) {
    let bulkWrites: AnyBulkWriteOperation<DbProductRecord>[] = [];
    const eanAsinTable = await getCrawlDataCollection('asinean');
    const eanAsinMatches = await eanAsinTable
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

    debug && console.log('eanAsinMatches:', eanAsinMatches.length);

    if (eanAsinMatches.length) {
      wholeSaleProducts = wholeSaleProducts.reduce<DbProductRecord[]>(
        (acc, product) => {
          const ean = product.eanList[0];
          const match = eanAsinMatches.find((m) => m.eans.includes(ean));
          if (match && match.asin) {
            product.asin = match.asin;
            bulkWrites.push({
              updateOne: {
                filter: { _id: product._id },
                update: {
                  $set: { asin: product.asin },
                },
              },
            });
            acc.push(product);
          } else if (product?.asin) {
            acc.push(product);
          } else {
            bulkWrites.push({
              updateOne: {
                filter: { _id: product._id },
                update: {
                  $set: { a_status: 'keepa', a_locked: false },
                  $pull: { clrName: hostname },
                },
              },
            });
          }

          return acc;
        },
        []
      );
      if (bulkWrites.length) {
        await col.bulkWrite(bulkWrites);
      }
    }
  }

  return wholeSaleProducts;
};
