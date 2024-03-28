import {
  ProductLimitReachedStatus,
  TaskCompletedStatus,
  TimeLimitReachedStatus,
} from "./status.js";

export const handleResult = (r, res, rej) => {
  if (
    r instanceof TaskCompletedStatus ||
    r instanceof ProductLimitReachedStatus ||
    r instanceof TimeLimitReachedStatus
  ) {
    res(r);
  } else {
    rej(r);
  }
};
