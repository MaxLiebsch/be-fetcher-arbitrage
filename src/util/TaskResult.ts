import { TaskResultEvent } from "../types/tasks/TaskResult.js";

export const TASK_RESULT: { [key in TaskResultEvent]: TaskResultEvent } = {
  PRODUCT_LIMIT_REACHED: "PRODUCT_LIMIT_REACHED",
  TIME_LIMIT_REACHED: "TIME_LIMIT_REACHED",
  TASK_COMPLETED: "TASK_COMPLETED",
};
