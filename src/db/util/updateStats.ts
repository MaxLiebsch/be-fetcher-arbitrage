import { getCrawlDataDb, getProductsCol } from '../mongo.js';

export function reduceCount(res: any, prop: string) {
  const result: { [key: string]: number } = {};

  res.forEach((item: any) => {
    const key = item[prop] === null ? 'null' : item[prop];
    result[key] = item.count;
  });
  return result;
}

export async function updateStats() {
  const col = await getProductsCol();
  let stats = {};
  // Distinct count of the eanList
  const distinctProducts = await col
    .aggregate([
      { $group: { _id: null, distinctCount: { $addToSet: '$eanList' } } },
      { $project: { distinctCount: { $size: '$distinctCount' }, _id: 0 } },
    ])
    .toArray();

  if (distinctProducts.length > 0 && distinctProducts[0].distinctCount) {
    stats = {
      ...stats,
      distinctProducts: distinctProducts[0].distinctCount,
    };
  }
  // lookup info
  const lookupInfo = await col
    .aggregate([
      { $group: { _id: '$info_prop', count: { $sum: 1 } } },
      { $project: { _id: 0, info_prop: '$_id', count: 1 } },
    ])
    .toArray();

  if (lookupInfo.length > 0) {
    stats = {
      ...stats,
      lookupInfo: reduceCount(lookupInfo, 'info_prop'),
    };
  }
  // lookup category
  const lookupCategory = await col
    .aggregate([
      { $group: { _id: '$cat_prop', count: { $sum: 1 } } },
      { $project: { _id: 0, cat_prop: '$_id', count: 1 } },
    ])
    .toArray();

  if (lookupCategory.length > 0) {
    stats = {
      ...stats,
      lookupCategory: reduceCount(lookupCategory, 'cat_prop'),
    };
  }
  // scrapeEan
  const scrapeEan = await col
    .aggregate([
      { $group: { _id: '$ean_prop', count: { $sum: 1 } } },
      { $project: { _id: 0, ean_prop: '$_id', count: 1 } },
    ])
    .toArray();

  if (scrapeEan.length > 0) {
    stats = {
      ...stats,
      scrapeEan: reduceCount(scrapeEan, 'ean_prop'),
    };
  }
  // queryEansOnEby
  const queryEansOnEby = await col
    .aggregate([
      { $match: { eanList: { $size: 1 } } },
      { $group: { _id: '$eby_prop', count: { $sum: 1 } } },
      { $project: { _id: 0, eby_prop: '$_id', count: 1 } },
    ])
    .toArray();

  if (queryEansOnEby.length > 0) {
    stats = {
      ...stats,
      queryEansOnEby: reduceCount(queryEansOnEby, 'eby_prop'),
    };
  }
  // last24h
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const last24hStats = await col
    .aggregate([
      {
        $facet: {
          lookupInfo: [
            {
              $match: {
                infoUpdatedAt: {
                  $gt: last24h,
                },
              },
            },
            { $count: 'count' },
          ],
          lookupCategory: [
            {
              $match: {
                catUpdatedAt: {
                  $gt: last24h,
                },
              },
            },
            { $count: 'count' },
          ],
          qtyBatch: [
            {
              $match: {
                qty_updatedAt: {
                  $gt: last24h,
                },
              },
            },
            { $count: 'count' },
          ],
          nmBatch: [
            {
              $match: {
                nm_updatedAt: {
                  $gt: last24h,
                },
              },
            },
            { $count: 'count' },
          ],
          queryEansOnEby: [
            {
              $match: {
                qEbyUpdatedAt: {
                  $gt: last24h,
                },
              },
            },
            { $count: 'count' },
          ],
          scrapeEan: [
            {
              $match: {
                eanUpdatedAt: {
                  $gt: last24h,
                },
              },
            },
            { $count: 'count' },
          ],
          dealOnEby: [
            {
              $match: {
                dealEbyUpdatedAt: {
                  $gt: last24h,
                },
              },
            },
            { $count: 'count' },
          ],
          negDealOnEby: [
            {
              $match: {
                ebyUpdatedAt: {
                  $gt: last24h,
                },
              },
            },
            { $count: 'count' },
          ],
          dealOnAzn: [
            {
              $match: {
                dealAznUpdatedAt: {
                  $gt: last24h,
                },
              },
            },
            { $count: 'count' },
          ],
          negDealOnAzn: [
            {
              $match: {
                aznUpdatedAt: {
                  $gt: last24h,
                },
              },
            },
            { $count: 'count' },
          ],
          keepa: [
            {
              $match: {
                keepaUpdatedAt: {
                  $gt: last24h,
                },
              },
            },
            { $count: 'count' },
          ], 
          products: [
            {
              $match: {
                availUpdatedAt: {
                  $gt: last24h,
                },
              },
            },
            { $count: 'count' },
          ],
        },
      },
    ])
    .toArray();
  if (last24hStats.length > 0) {
    const reducedLast24hStats = Object.keys(last24hStats[0]).reduce(
      (acc, key) => {
        if(last24hStats[0][key].length){
          const value = last24hStats[0][key][0].count;
          acc[key] = value;
        }
        return acc;
      },
      {} as { [key: string]: number }
    );
    stats = {
      ...stats,
      last24hStats: reducedLast24hStats,
    };
  }

  const db = await getCrawlDataDb();

  return db
    .collection('stats')
    .updateOne(
      { name: 'processStats' },
      {
        $set: {
          name: 'processStats',
          ...stats,
          updatedAt: new Date().toISOString(),
        },
      },
      { upsert: true }
    );
}
