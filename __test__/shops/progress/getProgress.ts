import { ObjectId } from '@dipmaxtech/clr-pkg';
import { getTaskProgress } from '../../../src/db/util/multiShopUtilities/getTaskProgress.js';
import { getTaskProgressAgg } from '../../../src/db/util/multiShopUtilities/getTaskProgressAgg.js';
import { getWholesaleSearchProgress } from '../../../src/db/util/wholesaleSearch/getWholesaleProgress.js';
import { updateWholesaleProgress } from '../../../src/util/updateProgressInTasks.js';
import { findPendingShops } from '../../../src/db/util/multiShopUtilities/findPendingShops.js';

async function testProgress() {
  const result = await getTaskProgress('idealo.de', 'CRAWL_EAN', true)
  console.log('result:', result)
  // const result = await getTaskProgressAgg("alza.de", "DEALS_ON_EBY");
  // console.log('result:', result)
}

testProgress()
  .then((r) => process.exit(0))
  .catch((e) => {
    console.error(e);

    process.exit(1);
  });
