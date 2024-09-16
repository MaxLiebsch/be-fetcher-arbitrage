import { UTCDate } from "@date-fns/utc";

export const subDateDaysISO = (days: number) =>
  new UTCDate(Date.now() - 1000 * 60 * 60 * 24 * days).toISOString();

export const getElapsedTime = (start: number) => {
  const endTime = Date.now();
  const elapsedTime = (endTime - start) / 1000 / 60 / 60;
  return { elapsedTimeStr: `${elapsedTime.toFixed(2)} h`, elapsedTime };
};
