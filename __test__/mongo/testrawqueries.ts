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

const aznAggregationCntv3 = [
  {
    $match: {
      a_pblsh: true,
      a_mrgn: { $gt: 0 },
      sdmn: { $nin: ['wholesale'] },
      $text: { $search: 'iphon' },
      buyBoxIsAmazon: { $in: [true, false, null] },
      $and: [
        { bsr: { $size: 1 } },
        { 'bsr.number': { $gt: 0, $lte: 1000000 } },
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
    $project: {
      sourceDomain: '$shop',
      prc: 1,
      uprc: 1,
      lnk: 1,
      img: 1,
      nm: 1,
      cur: 1,
      eanList: 1,
      s: 1,
      qty_v: 1,
      nm_v: 1,
      ean: 1,
      availUpdatedAt: 1,
      qty: 1,
      createdAt: 1,
      updatedAt: 1,
      tax: 1,
      shop: '$sdmn',
      _id: 1,
      mnfctr: 1,
      sdmn: 1,
      a_pblsh: 1,
      a_nm: 1,
      a_useCurrPrice: 1,
      a_cur: 1,
      a_rating: 1,
      a_reviewcnt: 1,
      bsr: 1,
      a_img: 1,
      a_avg_price: 1,
      a_avg_fld: 1,
      dealAznUpdatedAt: 1,
      asin: 1,
      a_prc: 1,
      costs: 1,
      a_uprc: 1,
      a_qty: 1,
      a_orgn: 1,
      a_mrgn: 1,
      a_mrgn_pct: 1,
      a_w_mrgn: 1,
      a_w_mrgn_pct: 1,
      a_p_w_mrgn: 1,
      a_p_w_mrgn_pct: 1,
      a_p_mrgn: 1,
      a_vrfd: 1,
      a_p_mrgn_pct: 1,
      drops30: 1,
      drops90: 1,
      categories: 1,
      numberOfItems: 1,
      availabilityAmazon: 1,
      categoryTree: 1,
      salesRanks: 1,
      monthlySold: 1,
      ahstprcs: 1,
      anhstprcs: 1,
      auhstprcs: 1,
      curr_ahsprcs: 1,
      curr_ansprcs: 1,
      curr_ausprcs: 1,
      curr_salesRank: 1,
      avg30_ahsprcs: 1,
      avg30_ansprcs: 1,
      avg30_ausprcs: 1,
      avg30_salesRank: 1,
      avg90_ahsprcs: 1,
      avg90_ansprcs: 1,
      avg90_ausprcs: 1,
      avg90_salesRank: 1,
      buyBoxIsAmazon: 1,
      stockAmount: 1,
      stockBuyBox: 1,
      totalOfferCount: 1,
    },
  },
  {
    $lookup: {
      from: 'userSeen',
      let: { productId: '$_id' },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$productId', '$$productId'] },
                { $eq: ['$userId', '676840cf003bbc865015'] },
                { $eq: ['$target', 'a'] },
              ],
            },
          },
        },
      ],
      as: 'seenDocs',
    },
  },
  { $addFields: { seen: { $gt: [{ $size: '$seenDocs' }, 0] } } },
  { $project: { seenDocs: 0 } },
  {
    $lookup: {
      from: 'userInvalid',
      let: { pid: '$_id' },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$productId', '$$pid'] },
                { $eq: ['$userId', '676840cf003bbc865015'] },
                { $eq: ['$target', 'a'] },
              ],
            },
          },
        },
      ],
      as: 'invalidDocs',
    },
  },
  { $match: { invalidDocs: { $eq: [] } } },
  {
    $lookup: {
      from: 'userIrrelevant',
      let: { pid: '$_id' },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$productId', '$$pid'] },
                { $eq: ['$userId', '676840cf003bbc865015'] },
                { $eq: ['$target', 'a'] },
              ],
            },
          },
        },
      ],
      as: 'irrelevantDocs',
    },
  },
  { $match: { invalidDocs: { $eq: [] } } },
  { $sort: { seen: 1, a_mrgn: 1 } },
  { $skip: 0 },
  { $limit: 20 },
  {
    $lookup: {
      from: 'users',
      let: { productId: '$_id', target: 'a' },
      pipeline: [
        { $match: { userId: '676840cf003bbc865015' } },
        { $unwind: '$bookmarks' },
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$bookmarks.productId', '$$productId'] },
                { $eq: ['$bookmarks.target', '$$target'] },
              ],
            },
          },
        },
        { $project: { _id: 1 } },
      ],
      as: 'isBookmarked',
    },
  },
  { $addFields: { isBookmarked: { $gt: [{ $size: '$isBookmarked' }, 0] } } },
];
