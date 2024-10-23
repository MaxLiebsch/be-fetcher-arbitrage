import { getProductsCol } from '../../src/db/mongo.js';
import { endOfMonth, isWithinInterval, startOfYear } from 'date-fns';
import { UTCDate } from '@date-fns/utc';

const testQueries = async () => {
  const col = await getProductsCol();
  const strg_1_hy = isWithinInterval(new Date(), {
    start: startOfYear(new UTCDate()),
    end: endOfMonth(new Date(new Date().getFullYear(), 8)),
  });

  const res = await col
    .aggregate([
      {
        $match: {
          a_pblsh: true,
          a_prc: { $gt: 0 },
          $and: [
            {
              $or: [
                { avg30_ahsprcs: { $exists: true, $gt: 0 } },
                { avg30_ansprcs: { $exists: true, $gt: 0 } },
                { avg90_ahsprcs: { $exists: true, $gt: 0 } },
                { avg90_ansprcs: { $exists: true, $gt: 0 } },
              ],
            },
            {
              $or: [
                {
                  aznUpdatedAt: {
                    $gt: new Date(Date.now() - 96 * 60 * 1000).toISOString(),
                  },
                },
                {
                  dealAznUpdatedAt: {
                    $gt: new Date(Date.now() - 96 * 60 * 1000).toISOString(),
                  },
                },
              ],
            },
            { costs: { $exists: true } },
          ],
        },
      },
      {
        $addFields: {
          a_avg_prc: {
            $divide: [
              {
                $cond: {
                  if: { $gt: ['$avg30_ahsprcs', -1] },
                  then: '$avg30_ahsprcs',
                  else: {
                    $cond: {
                      if: { $gt: ['$avg30_ansprcs', -1] },
                      then: '$avg30_ansprcs',
                      else: {
                        $cond: {
                          if: { $gt: ['$avg90_ahsprcs', -1] },
                          then: '$avg90_ahsprcs',
                          else: '$avg90_ansprcs',
                        },
                      },
                    },
                  },
                },
              },
              100,
            ],
          },
        },
      },
      {
        $addFields: {
          'costs.azn': {
            $round: [
              {
                $multiply: [
                  {
                    $divide: ['$costs.azn', '$a_prc'],
                  },
                  '$a_avg_prc',
                ],
              },
              2,
            ],
          },
        },
      },
      {
        $addFields: {
          [`a_mrgn`]: {
            $round: [
              {
                $subtract: [
                  '$a_avg_prc',
                  {
                    $add: [
                      {
                        $divide: [
                          {
                            $multiply: [
                              '$a_prc',
                              { $divide: ['$a_qty', '$qty'] },
                            ],
                          },
                          {
                            $add: [
                              1,
                              { $divide: [{ $ifNull: ['$tax', 19] }, 100] },
                            ],
                          },
                        ],
                      },
                      // taxes
                      {
                        $subtract: [
                          '$a_avg_prc',
                          {
                            $divide: [
                              '$a_avg_prc',
                              {
                                $add: [
                                  1,
                                  { $divide: [{ $ifNull: ['$tax', 19] }, 100] },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                      '$costs.tpt',
                      '$costs.varc',
                      strg_1_hy ? '$costs.strg_1_hy' : '$costs.strg_2_hy',
                      '$costs.azn',
                    ],
                  },
                ],
              },
              2,
            ],
          },
        },
      },
      {
        $addFields: {
          [`a_mrgn_pct`]: {
            $round: [
              {
                $multiply: [
                  {
                    $divide: ['$a_mrgn', '$a_avg_prc'],
                  },
                  100,
                ],
              },
              2,
            ],
          },
        },
      },
      {
        $match: {
          a_mrgn: { $gt: 0 },
          a_mrgn_pct: { $gt: 0 },
        },
      },
      {
        $skip: 0,
      },
      {
        $count: 'total',
      },
    ])
    .toArray();
  console.log('res', res);
  // console.log(
  //   res.map((r) => {
  //     return {
  //       a_mrgn: r.a_mrgn,
  //       ean: r.ean || r.eanList,
  //       a_mrgn_pct: r.a_mrgn_pct,
  //       a_prc: r.a_prc,
  //       a_uprc: r.a_uprc,
  //       sdmn: r.sdmn,
  //       a_avg_prc: r.a_avg_prc,
  //       costs: r.costs,
  //       avg30_ahsprcs: r.avg30_ahsprcs,
  //       avg30_ansprcs: r.avg30_ansprcs,
  //       avg90_ahsprcs: r.avg90_ahsprcs,
  //       avg90_ansprcs: r.avg90_ansprcs,
  //     };
  //   }),
  // );
};

testQueries().then((r) => {
  process.exit(0);
});
