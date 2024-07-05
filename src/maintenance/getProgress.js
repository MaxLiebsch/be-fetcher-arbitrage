
import { ObjectId } from "mongodb";
import { getMissingEanShops } from "../services/db/util/crawlEan/getMissingEanShops.js";
import { getMissingEbyCategoryShops } from "../services/db/util/lookupCategory/getMissingEbyCategoryShops.js";
import { getLookupInfoProgress } from "../services/db/util/lookupInfo/getLookupInfoProgress.js";
import { getUnmatchedEanShops } from "../services/db/util/lookupInfo/getUnmatchedEanShops.js";
import { getProductsToLookupCount, getWholesaleProgress } from "../services/db/util/wholesale/getWholesaleProgress.js";
import { updateWholesaleProgress } from "../util/updateProgressInTasks.js";

const main = async () => {
  const shop = "idealo.de";
  const p = await updateWholesaleProgress(new ObjectId('6687e3b9ccabc5753f1b424c'), 98)
  console.log('p:', p)
 
};

main().then((r)=> process.exit(0));
