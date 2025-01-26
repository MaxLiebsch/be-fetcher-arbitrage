import { ObjectId } from '@dipmaxtech/clr-pkg';
import { getProductsCol } from '../../src/db/mongo.js';
import {
  countPendingProductsForCrawlEanQuery,
  countPendingProductsQueryEansOnEbyQuery,
} from '../../src/db/util/queries.js';
import { writeFileSync } from 'fs';

async function main() {
  const col = await getProductsCol();
  console.time('query');
  const result = await col
    .aggregate(aznAggregationCntv3)
    .explain('executionStats');
  // .toArray();
  console.timeEnd('query');
  console.log('result:', JSON.stringify(result));
  writeFileSync('query.json', JSON.stringify(result));
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
      a_mrgn: { $gt: 0 },
      sdmn: 'sales',
      buyBoxIsAmazon: { $in: [true, false, null] },
      $and: [
        { bsr: { $size: 1 } },
        { 'bsr.number': { $gt: 0, $lte: 10000000 } },
      ],
      a_avg_fld: { $ne: null },
    },
  },
  { $addFields: { computedPrice: '$a_avg_price' } },
  {
    $addFields: {
      a_mrgn: {
        $cond: {
          if: { $eq: ['$computedPrice', null] },
          then: null,
          else: {
            $round: [
              {
                $subtract: [
                  '$computedPrice',
                  {
                    $add: [
                      {
                        $divide: [
                          {
                            $multiply: [
                              '$prc',
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
                      {
                        $subtract: [
                          '$computedPrice',
                          {
                            $divide: [
                              '$computedPrice',
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
                      '$costs.strg_1_hy',
                      0,
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
    },
  },
  { $match: { a_mrgn: { $gt: 0 } } },
  {
    $addFields: {
      a_mrgn_pct: {
        $cond: {
          if: { $eq: ['$a_mrgn', null] },
          then: null,
          else: {
            $round: [
              { $multiply: [{ $divide: ['$a_mrgn', '$computedPrice'] }, 100] },
              2,
            ],
          },
        },
      },
    },
  },
  {
    $facet: {
      totalProducts: [
        {
          $match: {
            a_pblsh: true,
            a_mrgn: { $gt: 0 },
            sdmn: 'sales',
            buyBoxIsAmazon: { $in: [true, false, null] },
            $and: [
              { bsr: { $size: 1 } },
              { 'bsr.number': { $gt: 0, $lte: 10000000 } },
            ],
            a_avg_fld: { $ne: null },
          },
        },
        { $count: 'count' },
      ],
      totalProductsToday: [
        {
          $match: {
            a_pblsh: true,
            a_mrgn: { $gt: 0 },
            sdmn: 'sales',
            buyBoxIsAmazon: { $in: [true, false, null] },
            $and: [
              { bsr: { $size: 1 } },
              { 'bsr.number': { $gt: 0, $lte: 10000000 } },
            ],
            a_avg_fld: { $ne: null },
            info_prop: { $eq: 'complete' },
            createdAt: {
              $gte: '2025-01-20T00:00:00.000Z',
              $lt: '2025-01-21T00:00:00.000Z',
            },
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
