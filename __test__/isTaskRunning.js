import { isAiTaskRunning, isTaskRunning } from "../src/maintenance/resetTasksIds.js";
import { getTasks } from "../src/db/util/tasks.js";

async function main() {
  const tasks = await getTasks();

//   let task = tasks.find((t) => t.type === "MATCH_TITLES");
//   task.batches.push({batchId: 'batch_1PaVMYwd8rSmeCaiVcEEimMI'}); 
//   tasks.push(task);
  const isRunning = isAiTaskRunning(tasks, 'batch_1PaVMYwd8rSmeCaiVcEEimMI', 'nm_batchId');
  console.log('isRunning:', isRunning)
}

main().then((r) => process.exit(0));
