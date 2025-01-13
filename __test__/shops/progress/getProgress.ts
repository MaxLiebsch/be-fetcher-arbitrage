import { ObjectId } from '@dipmaxtech/clr-pkg';
import { getTaskProgress } from '../../../src/db/util/multiShopUtilities/getTaskProgress.js';
import { getTaskProgressAgg } from '../../../src/db/util/multiShopUtilities/getTaskProgressAgg.js';
import { getWholesaleSearchProgress } from '../../../src/db/util/wholesaleSearch/getWholesaleProgress.js';
import { updateWholesaleProgress } from '../../../src/util/updateProgressInTasks.js';
import { findPendingShops } from '../../../src/db/util/multiShopUtilities/findPendingShops.js';
import { countPendingProductsForWholesaleSearchQuery } from '../../../src/db/util/queries.js';
import { getProductsCol } from '../../../src/db/mongo.js';

async function testProgress() {
  // const col = await getProductsCol();
  // const result = await col.find(
  //   countPendingProductsForWholesaleSearchQuery(
  //     new ObjectId('6784dbfb996b7d680ea69af0')
  //   ) as unknown as any
  // ).toArray()
  // console.log(JSON.stringify(countPendingProductsForWholesaleSearchQuery(
  //   new ObjectId('6784dbfb996b7d680ea69af0')
  // )), 'result:', result.length);
  await updateWholesaleProgress(new ObjectId('6784dbfb996b7d680ea69af0'), 'WHOLESALE_SEARCH');
  // const result = await getTaskProgressAgg("alza.de", "DEALS_ON_EBY");
  // console.log('result:', result)
}

testProgress()
  .then((r) => process.exit(0))
  .catch((e) => {
    console.error(e);

    process.exit(1);
  });
