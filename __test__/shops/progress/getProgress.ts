import { getTaskProgress } from "../../../src/db/util/multiShopUtilities/getTaskProgress.js";
import { getTaskProgressAgg } from "../../../src/db/util/multiShopUtilities/getTaskProgressAgg.js";

async function testProgress() {
  const result = await getTaskProgressAgg("alza.de", "DEALS_ON_EBY");

  console.log('result:', result)
}

testProgress()
  .then((r) => process.exit(0))
  .catch((e) => {
    console.error(e);
    
    
    process.exit(1)});
