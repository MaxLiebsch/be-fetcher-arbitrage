import { getProductsCol } from '../../src/db/mongo.js';
import {
  countPendingProductsForCrawlEanQuery,
  countPendingProductsQueryEansOnEbyQuery,
} from '../../src/db/util/queries.js';

async function main() {
  const col = await getProductsCol();
  console.time('query');
  const result = await col
    .aggregate([
      {
        $match: {
          a_pblsh: true,
          'costs.azn': { $exists: true },
          a_prc: {
            $gt: 0,
          },
          aznUpdatedAt: {
            $gt: '2024-11-05T09:32:17.570Z',
          },
          $or: [
            {
              avg30_ahsprcs: {
                $exists: true,
                $gt: 0,
              },
            },
            {
              avg30_ansprcs: {
                $exists: true,
                $gt: 0,
              },
            },
            {
              avg90_ahsprcs: {
                $exists: true,
                $gt: 0,
              },
            },
            {
              avg90_ansprcs: {
                $exists: true,
                $gt: 0,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          a_avg_prc: {
            $divide: [
              {
                $cond: {
                  if: {
                    $gt: ['$avg30_ahsprcs', -1],
                  },
                  then: '$avg30_ahsprcs',
                  else: {
                    $cond: {
                      if: {
                        $gt: ['$avg30_ansprcs', -1],
                      },
                      then: '$avg30_ansprcs',
                      else: {
                        $cond: {
                          if: {
                            $gt: ['$avg90_ahsprcs', -1],
                          },
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
          a_w_mrgn: {
            $round: [
              {
                $subtract: [
                  '$a_avg_prc',
                  {
                    $add: [
                      {
                        $divide: [
                          '$a_prc',
                          {
                            $add: [
                              1,
                              {
                                $divide: [
                                  {
                                    $ifNull: ['$tax', 19],
                                  },
                                  100,
                                ],
                              },
                            ],
                          },
                        ],
                      },
                      {
                        $subtract: [
                          '$a_avg_prc',
                          {
                            $divide: [
                              '$a_avg_prc',
                              {
                                $add: [
                                  1,
                                  {
                                    $divide: [
                                      {
                                        $ifNull: ['$tax', 19],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                      '$costs.tpt',
                      '$costs.varc',
                      '$costs.strg_2_hy',
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
          a_w_mrgn_pct: {
            $round: [
              {
                $multiply: [
                  {
                    $divide: ['$a_w_mrgn', '$a_avg_prc'],
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
          a_pblsh: true,
          $and: [
            {
              a_prc: {
                $gt: 0,
              },
            },
            {
              a_w_mrgn: {
                $gt: 0,
              },
            },
            {
              a_w_mrgn_pct: {
                $gt: 0,
              },
            },
            {
              $or: [
                {
                  $and: [
                    {
                      'a_vrfd.vrfd': true,
                    },
                    {
                      'a_vrfd.vrfn_pending': false,
                    },
                  ],
                },
                {
                  $and: [
                    {
                      'a_vrfd.vrfd': false,
                    },
                    {
                      'a_vrfd.vrfn_pending': true,
                    },
                  ],
                },
                {
                  'a_vrfd.flag_cnt': {
                    $lt: {
                      $size: 3,
                    },
                  },
                },
              ],
            },
            {
              $or: [
                {
                  buyBoxIsAmazon: true,
                },
                {
                  buyBoxIsAmazon: false,
                },
                {
                  buyBoxIsAmazon: null,
                },
              ],
            },
            {
              $and: [
                {
                  bsr: {
                    $size: 1,
                  },
                },
                {
                  'bsr.number': {
                    $lte: 1000000,
                  },
                },
              ],
            },
          ],
        },
      },
      {
        $count: 'productCount',
      },
    ])
    .toArray();
  console.timeEnd('query');
  console.log('result:', JSON.stringify(result.length));
}

main().then(() => {
  console.log('done');
  process.exit(0);
});
