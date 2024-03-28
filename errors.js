export function ProductLimitReachedError(message = "", taskType) {
  const error = Error.call(this,message)
  this.message = error.message;
  this.stack = error.stack;
  this.name = "PRODUCT_LIMIT_REACHED";
  this.taskType = taskType;
}
ProductLimitReachedError.prototype = Object.create(Error.prototype);
ProductLimitReachedError.prototype.constructor = ProductLimitReachedError;


export function TimeLimitReachedError(message = "", taskType) {
  const error = Error.call(this,message)
  this.message = error.message;
  this.stack = error.stack;
  this.name = "TIME_LIMIT_REACHED";
  this.taskType = taskType;
}
TimeLimitReachedError.prototype = Object.create(Error.prototype);
TimeLimitReachedError.prototype.constructor = TimeLimitReachedError;

export function TaskCompletedError(message = "", taskType) {
  const error = Error.call(this,message)
  this.message = error.message;
  this.stack = error.stack;
  this.name = "COMPLETED";
  this.taskType = taskType;
}
TaskCompletedError.prototype = Object.create(Error.prototype);
TaskCompletedError.prototype.constructor = TaskCompletedError;


export function MissingProductsError(message = "", task) {
  const error = Error.call(this,message)
  this.message = error.message;
  this.stack = error.stack;
  this.name = "MISSING_LOOKUP_PRODCUTS";
  this.taskType = task;
}
MissingProductsError.prototype = Object.create(Error.prototype);
MissingProductsError.prototype.constructor = MissingProductsError;


export function MissingShopError(message = "", task) {
  const error = Error.call(this,message)
  this.message = error.message;
  this.stack = error.stack;
  this.name = "MISSING_SHOP";
  this.taskType = task;
}
MissingShopError.prototype = Object.create(Error.prototype);
MissingShopError.prototype.constructor = MissingShopError;