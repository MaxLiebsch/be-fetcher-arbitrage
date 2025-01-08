import { ObjectId } from '@dipmaxtech/clr-pkg';
import { getProductsCol } from '../../src/db/mongo.js';
import {
  countPendingProductsForCrawlEanQuery,
  countPendingProductsQueryEansOnEbyQuery,
} from '../../src/db/util/queries.js';

async function main() {
  const col = await getProductsCol();
  console.time('query');
  const result = await col
    .aggregate(aznAggregationCntv3)
    // .explain('executionStats');
    .toArray();
  console.timeEnd('query');
  console.log('result:', JSON.stringify(result));
}

main().then(() => {
  console.log('done');
  process.exit(0);
});

const ebyAggregationCnt = [
  {
    $match: {
      e_pblsh: true,
      sdmn: 'idealo.de',
      e_prc: { $gt: 0 },
    },
  },
  {
    $addFields: {
      e_mrgn: {
        $round: [
          {
            $subtract: [
              '$e_prc',
              {
                $add: [
                  {
                    $divide: [
                      { $multiply: ['$prc', { $divide: ['$e_qty', '$qty'] }] },
                      {
                        $add: [
                          1,
                          { $divide: [{ $ifNull: ['$tax', 19] }, 100] },
                        ],
                      },
                    ],
                  },
                  '$e_tax',
                  4.95,
                  0,
                  0,
                  '$e_costs',
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
      e_mrgn_pct: {
        $round: [{ $multiply: [{ $divide: ['$e_mrgn', '$e_prc'] }, 100] }, 2],
      },
    },
  },
  {
    $match: {
      e_mrgn: { $gt: 0 },
    },
  },
  { $count: 'productCount' },
];
const ebyAggregationCntv2 = [
  { $match: { e_pblsh: true, e_prc: { $gt: 0 }, sdmn: 'idealo.de' } },
  {
    $addFields: {
      e_mrgn: {
        $round: [
          {
            $subtract: [
              '$e_prc',
              {
                $add: [
                  {
                    $divide: [
                      { $multiply: ['$prc', { $divide: ['$e_qty', '$qty'] }] },
                      {
                        $add: [
                          1,
                          { $divide: [{ $ifNull: ['$tax', 19] }, 100] },
                        ],
                      },
                    ],
                  },
                  '$e_tax',
                  4.95,
                  0,
                  0,
                  '$e_costs',
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
      e_mrgn_pct: {
        $round: [{ $multiply: [{ $divide: ['$e_mrgn', '$e_prc'] }, 100] }, 2],
      },
    },
  },
  { $match: { e_mrgn: { $gt: 0 } } },
  { $count: 'productCount' },
];

const aznOriginal = [
  {
    $match: {
      sdmn: 'sales',
      a_pblsh: true,
      a_prc: { $gt: 0 },
      buyBoxIsAmazon: { $in: [true, false, null] },
      $and: [
        { bsr: { $size: 1 } },
        { 'bsr.number': { $gt: 0, $lte: 1000000 } },
      ],
    },
  },
  {
    $facet: {
      totalProducts: [
        {
          $match: {
            sdmn: 'sales',
            a_pblsh: true,
            $and: [
              { a_w_mrgn: { $gt: 0 } },
              {
                $or: [
                  { buyBoxIsAmazon: true },
                  { buyBoxIsAmazon: false },
                  { buyBoxIsAmazon: null },
                ],
              },
              {
                $and: [
                  { bsr: { $size: 1 } },
                  { 'bsr.number': { $gt: 0, $lte: 1000000 } },
                ],
              },
            ],
          },
        },
        { $count: 'count' },
      ],
      totalProductsToday: [
        {
          $match: {
            createdAt: {
              $gte: '2024-11-17T23:00:00.000Z',
              $lt: '2024-11-18T23:00:00.000Z',
            },
            a_pblsh: true,
            $and: [
              { a_w_mrgn: { $gt: 0 } },
              {
                $or: [
                  { buyBoxIsAmazon: true },
                  { buyBoxIsAmazon: false },
                  { buyBoxIsAmazon: null },
                ],
              },
              {
                $and: [
                  { bsr: { $size: 1 } },
                  { 'bsr.number': { $gt: 0, $lte: 1000000 } },
                ],
              },
            ],
          },
        },
        { $count: 'count' },
      ],
    },
  },
  {
    $project: {
      productCount: { $arrayElemAt: ['$totalProducts.count', 0] },
      totalProductsToday: { $arrayElemAt: ['$totalProductsToday.count', 0] },
    },
  },
];

const aznAggregationCntv3 = [
  {
    $match: {
      a_pblsh: true,
      'costs.azn': { $gt: 0 },
      aznUpdatedAt: { $gt: '2024-12-05T15:18:54.393Z' },
      $or: [
        { avg30_ahsprcs: { $gt: 0 } },
        { avg30_ansprcs: { $gt: 0 } },
        { avg90_ahsprcs: { $gt: 0 } },
        { avg90_ansprcs: { $gt: 0 } },
      ],
      buyBoxIsAmazon: { $in: [true, false, null] },
      $and: [
        { bsr: { $size: 1 } },
        { 'bsr.number': { $gt: 0, $lte: 10000000 } },
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
  { $match: { a_avg_prc: { $gt: 0 } } },
  {
    $addFields: {
      'costs.azn': {
        $round: [
          { $multiply: [{ $divide: ['$costs.azn', '$a_prc'] }, '$a_avg_prc'] },
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
                          { $divide: [{ $ifNull: ['$tax', 19] }, 100] },
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
                              { $divide: [{ $ifNull: ['$tax', 19] }, 100] },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  '$costs.tpt',
                  '$costs.varc',
                  1,
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
  { $match: { a_w_mrgn: { $gte: 0 } } },
  {
    $addFields: {
      a_w_mrgn_pct: {
        $round: [
          { $multiply: [{ $divide: ['$a_w_mrgn', '$a_avg_prc'] }, 100] },
          2,
        ],
      },
    },
  },
  { $match: { a_w_mrgn: { $gt: 0 }, a_w_mrgn_pct: { $gte: 0 } } },
  { $group: { _id: { field2: '$asin' }, document: { $first: '$$ROOT' } } },
  { $replaceRoot: { newRoot: '$document' } },
  { $count: 'productCount' },
];
