import { getCrawlAznListingsProgress } from "../../../src/services/db/util/getCrawlAznListingsProgress.js";
import { getCrawlEanProgress } from "../../../src/services/db/util/getCrawlEanProgress.js";
import { getLookupInfoProgress } from "../../../src/services/db/util/getLookupInfoProgress.js";
import { updateCrawlAznListingsProgress, updateProgressInCrawlEanTask } from "../../../src/util/updateProgressInTasks.js";



const progress = async() => { 
    const domain = ''
    const progress = await getLookupInfoProgress('alternate.de');
    // const progress = await updateProgressInCrawlEanTask('mix')
    // const progress = await updateCrawlAznListingsProgress('alternate.de')
    // const progress = await getCrawlAznListingsProgress('alternate.de')
    // const progress = await getCrawlEanProgress('dm.de')
    console.log('progress:', progress)
}

progress().then(() => {
    process.exit(0);
});