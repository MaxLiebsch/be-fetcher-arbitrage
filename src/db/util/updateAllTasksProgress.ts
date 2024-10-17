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
  await updateProgressDealsOnAznTasks();
  await updateProgressDealsOnEbyTasks();
  await updateProgressNegDealTasks();
  await updateProgressInCrawlEanTask();
  await updateProgressInLookupCategoryTask();
  await updateProgressInQueryEansOnEbyTask();
  await updateProgressInLookupInfoTask();
}
