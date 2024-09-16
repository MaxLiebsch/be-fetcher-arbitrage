import { TaskErrors } from "./errors.js";
import {
  ProductLimitReachedStatus,
  TaskCompletedStatus,
  TimeLimitReachedStatus,
} from "./status.js";

export type ResultType =
  | typeof TaskCompletedStatus
  | typeof ProductLimitReachedStatus
  | typeof TimeLimitReachedStatus;


export const handleResult = (
  result: TaskCompletedStatus | TaskErrors,
  res: (value: TaskCompletedStatus) => void,
  rej: (reason?: any) => void
) => {
  if (result instanceof TaskCompletedStatus) {
    res(result);
  } else {
    rej(result);
  }
};
