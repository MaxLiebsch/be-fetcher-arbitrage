import { TaskTypes } from "@dipmaxtech/clr-pkg";
import { Tasks } from "./types/tasks/Tasks.js";

export function ProductLimitReachedError(
  this: any,
  message = "",
  taskType: TaskTypes
) {
  const error = Error.call(this, message);
  this.message = error.message;
  this.stack = error.stack;
  this.name = "PRODUCT_LIMIT_REACHED";
  this.taskType = taskType;
}

export function TimeLimitReachedError(
  this: any,
  message = "",
  taskType: TaskTypes
) {
  const error = Error.call(this, message);
  this.message = error.message;
  this.stack = error.stack;
  this.name = "TIME_LIMIT_REACHED";
  this.taskType = taskType;
}

export function TaskCompletedError(
  this: any,
  message = "",
  taskType: TaskTypes
) {
  const error = Error.call(this, message);
  this.message = error.message;
  this.stack = error.stack;
  this.name = "COMPLETED";
  this.taskType = taskType;
}

export class MissingProductsError {
  taskType: Tasks;
  name: string;

  constructor(message = "", task: Tasks) {
    this.name = "MISSING_LOOKUP_PRODCUTS";
    this.taskType = task;
  }
}


export class MissingShopError  {
  taskType: Tasks;
  name: string;

  constructor(message = "", task: Tasks) {
    this.name = "MISSING_SHOP";
    this.taskType = task;
  }
}


export function MissingTaskError(this: any, message = "", task: Tasks) {
  const error = Error.call(this, message);
  this.message = error.message;
  this.stack = error.stack;
  this.name = "TASK_NOT_FOUND";
  this.taskType = task;
}


export type TaskErrors =
  | typeof ProductLimitReachedError
  | typeof TimeLimitReachedError
  | typeof TaskCompletedError
  | typeof MissingProductsError
  | typeof MissingShopError
  | typeof MissingTaskError;
