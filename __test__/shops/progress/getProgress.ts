import {
  AnyBulkWriteOperation,
  DbProductRecord,
  determineAdjustedSellPrice,
  getAznAvgPrice,
  ObjectId,
  resetEbyProductQuery,
} from '@dipmaxtech/clr-pkg';
import { getTaskProgress } from '../../../src/db/util/multiShopUtilities/getTaskProgress.js';
import { getTaskProgressAgg } from '../../../src/db/util/multiShopUtilities/getTaskProgressAgg.js';
import { getWholesaleSearchProgress } from '../../../src/db/util/wholesaleSearch/getWholesaleProgress.js';
import { updateWholesaleProgress } from '../../../src/util/updateProgressInTasks.js';
import { findPendingShops } from '../../../src/db/util/multiShopUtilities/findPendingShops.js';
import {
  countPendingProductsForNetMarginEbyListingsAgg,
  countPendingProductsForWholesaleSearchQuery,
} from '../../../src/db/util/queries.js';
import {
  getCrawlDataCollection,
  getProductsCol,
} from '../../../src/db/mongo.js';
import { findPendingShopsWithAgg } from '../../../src/db/util/multiShopUtilities/findPendingShopsWithAgg.js';
import _ from 'underscore';
import { formatEan } from '../../../src/util/lookupCategoryHelper.js';

const aggs = [
  {
    eanList: { $size: 1 },
    $expr: { $lt: [{ $strLenCP: { $arrayElemAt: ['$eanList', 0] } }, 13] },
  },
];

async function testProgress() {
  const col = await getProductsCol();
  const productsWithHighFactor = await col
    .aggregate([
      {
        $match: {
          $and: [
            {
              a_avg_fld: { $eq: null },
            },
            {
              keepaUpdatedAt: {
                $exists: true,
              },
            },
          ],
        },
      },
    ])
    .toArray();
  console.log(productsWithHighFactor.length);
  const bulkWrites = productsWithHighFactor.map((r) => {
    const { avgField, avgPrice } = getAznAvgPrice(r as DbProductRecord);
    return {
      updateOne: {
        filter: { _id: r._id },
        update: {
          $set: {
            a_avg_fld: avgField,
            a_avg_price: avgPrice
          },
        },
      },
    };
  });
  const result = await col.bulkWrite(
    bulkWrites as AnyBulkWriteOperation<any>[]
  );
  console.log('result:mod:', result.modifiedCount, 'del:', result.deletedCount);

  // const result2 = await col
  // .aggregate([
  //   {
  //     $match: {
  //       sdmn: 'idealo.de',
  //       e_pblsh: true,
  //       'e_pRange.median': { $gt: 2000 },
  //     },
  //   },
  // ])
  // .toArray();
  // console.log('result2:', result2)

  // const { pendingShops, shops } = await findPendingShopsWithAgg(
  //   "DEALS_ON_EBY"
  // );
  // console.log('pendingShops:', pendingShops);
}

testProgress()
  .then((r) => process.exit(0))
  .catch((e) => {
    console.error(e);

    process.exit(1);
  });
