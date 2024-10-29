import { getProductsCol } from '../../src/db/mongo.js';

import _ from 'underscore';
import { reduceCount } from '../../src/db/util/updateStats.js';

const testQueries = async () => {
  const col = await getProductsCol();
  const last24h = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
  const res = await col
    .aggregate([
      { $group: { _id: '$info_prop', count: { $sum: 1 } } },
      { $project: { _id: 0, info_prop: '$_id', count: 1 } },
    ])
    .toArray();
  /*
      {
        missing: 0,
        complete: 0,
        null: 0,
      }
    */

  console.log('res', JSON.stringify(reduceCount(res, 'info_prop'), null, 2));
};

testQueries().then((r) => {
  process.exit(0);
});
