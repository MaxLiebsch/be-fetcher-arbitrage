import { Tasks } from "./types/tasks/Tasks.js";
import { TASK_RESULT } from "./util/TaskResult.js";
import { Stats } from "./types/tasks/TaskResult.js";
import { TASK_ERROR } from "./util/TaskError.js";

export class ProductLimitReachedStatus {
  message: string;
  name: string;
  task: Tasks;
  taskResult: Stats;

  constructor(message = "", task: Tasks, result: Stats) {
    this.message = message;
    this.name = TASK_RESULT.PRODUCT_LIMIT_REACHED;
    this.task = task;
    this.taskResult = result;
  }
}

export class TimeLimitReachedStatus {
  message: string;
  name: string;
  task: Tasks;
  taskResult: Stats;

  constructor(message = "", task: Tasks, result: Stats) {
    this.message = message;
    this.name = TASK_RESULT.TIME_LIMIT_REACHED;
    this.task = task;
    this.taskResult = result;
  }
}

export class TaskCompletedStatus {
  message: string;
  name: string;
  task: Tasks;
  stats: Stats;

  constructor(message = "", task: Tasks, result: Stats) {
    this.message = message;
    this.name = TASK_RESULT.TASK_COMPLETED;
    this.task = task;
    this.stats = result;
  }
}

export class MissingProductsStatus {
  message: string;
  name: string;
  task: Tasks;
  taskResult: Stats;

  constructor(message = "", task: Tasks, result: Stats) {
    this.message = message;
    this.name = TASK_ERROR.MISSING_LOOKUP_PRODCUTS;
    this.task = task;
    this.taskResult = result;
  }
}
