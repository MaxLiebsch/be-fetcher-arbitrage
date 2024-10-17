import { TaskErrors } from "./errors.js";
import { TaskCompletedStatus } from "./status.js";

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
