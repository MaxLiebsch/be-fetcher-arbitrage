
import { getMatchingProgress } from "../src/service/db/util/getMatchingProgress.js";

const main = async () => {
  const shop = "voelkner.de";
  // const lookupProgresss = await getAmazonLookupProgress('alternate.de')
  const lookupProgresss = await getMatchingProgress(shop);
  console.log('lookupProgresss:', lookupProgresss)
 
};

main().then((r)=> process.exit(0));
