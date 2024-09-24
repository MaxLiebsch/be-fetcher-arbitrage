import {
    updateProgressDealsOnAznTasks,
    updateProgressDealsOnEbyTasks,
    updateProgressInCrawlEanTask,
    updateProgressInLookupCategoryTask,
    updateProgressInLookupInfoTask,
    updateProgressInQueryEansOnEbyTask,
    updateProgressNegDealTasks,
  } from "../../util/updateProgressInTasks.js";

export async function updateAllTasksProgress() {
    await updateProgressDealsOnAznTasks("mix");
    await updateProgressDealsOnEbyTasks("mix");
    await updateProgressNegDealTasks("mix");
    await updateProgressInCrawlEanTask("mix");
    await updateProgressInLookupCategoryTask();
    await updateProgressInQueryEansOnEbyTask();
    await updateProgressInLookupInfoTask();
 }