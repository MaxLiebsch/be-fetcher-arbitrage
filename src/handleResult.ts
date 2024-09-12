import {
  ProductLimitReachedStatus,
  TaskCompletedStatus,
  TimeLimitReachedStatus,
} from "./status";

export type ResultType =
  | typeof TaskCompletedStatus
  | typeof ProductLimitReachedStatus
  | typeof TimeLimitReachedStatus;

const isExpectedStatus = (result: ResultType): result is ResultType => {
  return (
    result instanceof TaskCompletedStatus ||
    result instanceof ProductLimitReachedStatus ||
    result instanceof TimeLimitReachedStatus
  );
};

export const handleResult = (
  result: any,
  res: (value: ResultType) => void,
  rej: (reason?: any) => void
) => {
  if (isExpectedStatus(result)) {
    res(result);
  } else {
    rej(result);
  }
};
