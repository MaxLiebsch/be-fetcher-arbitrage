import { updateShopStats } from "../db/util/shops.js";

const main = async () => {
  const shop = "idealo.de";
  // const lookupProgresss = await getAmazonLookupProgress('alternate.de')
  const progress = await updateShopStats(shop);
  console.log('progress:', progress)
  // const lookupProgresss = await getMatchingProgress(shop, true);
  // console.log('lookupProgresss:', lookupProgresss)
 
};

main().then((r)=> process.exit(0));
