
import pkg from '@dipmaxtech/clr-pkg';
const { Status } = pkg;


export function ProductLimitReachedStatus(message = "", task, result= {}) {
  const status = Status.call(this, message);
  this.message = status.message;
  this.name = "PRODUCT_LIMIT_REACHED";
  this.task = task;
  this.result = result;
}
ProductLimitReachedStatus.prototype = Object.create(Status.prototype);
ProductLimitReachedStatus.prototype.constructor = ProductLimitReachedStatus;

export function TimeLimitReachedStatus(message = "", task, result = {}) {
  const status = Status.call(this, message);
  this.message = status.message;
  this.name = "TIME_LIMIT_REACHED";
  this.task = task;
  this.result = result;
}
TimeLimitReachedStatus.prototype = Object.create(Status.prototype);
TimeLimitReachedStatus.prototype.constructor = TimeLimitReachedStatus;

export function TaskCompletedStatus(message = "", task, result = {}) {
  const status = Status.call(this, message);
  this.message = status.message;
  this.name = "COMPLETED";
  this.task = task;
  this.result = result;
}
TaskCompletedStatus.prototype = Object.create(Status.prototype);
TaskCompletedStatus.prototype.constructor = TaskCompletedStatus;

export function MissingProductsStatus(message = "", task, result = {}) {
  const status = Status.call(this, message);
  this.message = status.message;
  this.name = "MISSING_LOOKUP_PRODCUTS";
  this.task = task;
  this.result = result;
}
MissingProductsStatus.prototype = Object.create(Status.prototype);
MissingProductsStatus.prototype.constructor = MissingProductsStatus;
