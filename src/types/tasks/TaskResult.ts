import { QueueStats } from "@dipmaxtech/clr-pkg";
import { TaskStats } from "../taskStats/TasksStats";

export type TaskResultEvent = "PRODUCT_LIMIT_REACHED" | "TIME_LIMIT_REACHED" | "TASK_COMPLETED" 


export interface Stats {
  taskStats: TaskStats;
  queueStats: QueueStats;
}
