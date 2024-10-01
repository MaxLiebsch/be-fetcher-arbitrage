import { ObjectId } from "@dipmaxtech/clr-pkg";
import { getTaskProgress } from "../../../src/db/util/multiShopUtilities/getTaskProgress.js";
import { getTaskProgressAgg } from "../../../src/db/util/multiShopUtilities/getTaskProgressAgg.js";
import { getWholesaleSearchProgress } from "../../../src/db/util/wholesaleSearch/getWholesaleProgress.js";
import { updateWholesaleProgress } from "../../../src/util/updateProgressInTasks.js";

async function testProgress() {
  const progress = await updateWholesaleProgress(
    new ObjectId("66fbe4b69c021d17268fbffc"),
    "WHOLESALE_EBY_SEARCH"
  );
  console.log("progress:", progress);
  // const result = await getTaskProgressAgg("alza.de", "DEALS_ON_EBY");
  // console.log('result:', result)
}

testProgress()
  .then((r) => process.exit(0))
  .catch((e) => {
    console.error(e);

    process.exit(1);
  });
