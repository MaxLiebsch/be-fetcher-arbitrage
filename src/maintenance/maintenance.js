import { createScanMatchTasks } from "../src/task.js";

const shopDomains = ['alza.de'];

const main = async () => {
    await createScanMatchTasks(shopDomains, false, { maintenance: true }) 
};

main().then(e => {process.exit(0);});
