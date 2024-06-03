import { createScanMatchTasks } from "../src/task.js";

const shopDomains = ['gamestop.de', 'weltbild.de'];

const main = async () => {
    await createScanMatchTasks(shopDomains, false, { maintenance: true }) 
};

main().then(e => {process.exit(0);});
