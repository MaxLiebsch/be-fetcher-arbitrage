import { TaskTypes } from "@dipmaxtech/clr-pkg";
import { Tasks } from "./types/tasks/Tasks";

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
ProductLimitReachedError.prototype = Object.create(Error.prototype);
ProductLimitReachedError.prototype.constructor = ProductLimitReachedError;

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
TimeLimitReachedError.prototype = Object.create(Error.prototype);
TimeLimitReachedError.prototype.constructor = TimeLimitReachedError;

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
TaskCompletedError.prototype = Object.create(Error.prototype);
TaskCompletedError.prototype.constructor = TaskCompletedError;

export class MissingProductsError extends Error {
  taskType: Tasks;

  constructor(message = "", task: Tasks) {
    super(message);
    this.name = "MISSING_LOOKUP_PRODCUTS";
    this.taskType = task;
  }
}

export class MissingShopError extends Error {
  taskType: Tasks;

  constructor(message = "", task: Tasks) {
    super(message);
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
MissingShopError.prototype = Object.create(Error.prototype);
MissingShopError.prototype.constructor = MissingShopError;

export type TaskErrors =
  | typeof ProductLimitReachedError
  | typeof TimeLimitReachedError
  | typeof TaskCompletedError
  | typeof MissingProductsError
  | typeof MissingShopError
  | typeof MissingTaskError;
