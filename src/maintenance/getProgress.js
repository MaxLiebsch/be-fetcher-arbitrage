
import { getMatchProgress } from "../services/db/util/match/getMatchProgress.js";

const main = async () => {
  const shop = "idealo.de";
  const p = await getMatchProgress('cyberport.de', false)
  console.log('p:', p); 
};

main().then((r)=> process.exit(0));
