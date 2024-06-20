
import { getMatchingProgress } from "../src/services/db/util/getMatchingProgress.js";

const main = async () => {
  const shop = "idealo.de";
  // const lookupProgresss = await getAmazonLookupProgress('alternate.de')
  const lookupProgresss = await getMatchingProgress(shop, true);
  console.log('lookupProgresss:', lookupProgresss)
 
};

main().then((r)=> process.exit(0));
