import {
  updateProgressDealsOnAznTasks,
  updateProgressDealsOnEbyTasks,
  updateProgressInCrawlEanTask,
  updateProgressInLookupCategoryTask,
  updateProgressInLookupInfoTask,
  updateProgressInQueryEansOnEbyTask,
  updateProgressNegDealTasks,
} from "../util/updateProgressInTasks.js";

const main = async () => {
  await updateProgressDealsOnAznTasks("mix");
  await updateProgressDealsOnEbyTasks("mix");
  await updateProgressNegDealTasks("mix");
  await updateProgressInCrawlEanTask("mix");
  await updateProgressInLookupCategoryTask();
  await updateProgressInQueryEansOnEbyTask();
  await updateProgressInLookupInfoTask();
};

main().then((r) => process.exit(0));
