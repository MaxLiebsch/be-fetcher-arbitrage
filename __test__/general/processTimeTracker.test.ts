import { ProcessTimeTracker } from "@dipmaxtech/clr-pkg";
import { describe, expect, test, beforeAll, afterAll } from "@jest/globals";
//@ts-ignore
import sinon from "sinon";
//@ts-ignore
import clientPool from "../../src/services/db/mongoPool.js";

let clock: sinon.SinonFakeTimers;
let timeTracker: ProcessTimeTracker;

describe("Process Time Tracker", () => {
  beforeAll(() => {
    clock = sinon.useFakeTimers({
      now: new Date("2024-07-24T23:50:00Z").getTime(),
    });
    console.log(
      "⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔\nStart: ",
      new Date()
    );
    timeTracker = ProcessTimeTracker.getSingleton(
      "test-crawler",
      clientPool["crawler-data"]
    );
  });

  test("Process Time Tracker", async () => {
    if (!timeTracker.initialized) await timeTracker.initPromise;
    timeTracker.markActive("CRAWL_SHOP");

    setTimeout(() => {
      console.log(
        "Mark inactive... afer 2 minutes 24th 23:52 activetime: 2 minutes"
      );
      timeTracker.markInactive();
      console.log("timeTracker:", timeTracker.activePeriods);
    }, 1000 * 60 * 2);
    clock.tick(1000 * 60 * 2);

    setTimeout(() => {
      console.log("Mark active... afer 1 minutem 24th 23:53");
      timeTracker.markActive("CRAWL_EAN");
    }, 1000 * 60 * 1);
    clock.tick(1000 * 60 * 1);

    setTimeout(() => {
      console.log(
        "Mark inactive... afer 2 minute 24th 23:55 activetime: 4 minutes"
      );
      timeTracker.markInactive();
      console.log("timeTracker:", timeTracker.activePeriods);
    }, 1000 * 60 * 2);
    clock.tick(1000 * 60 * 2);

    setTimeout(() => {
      console.log("Mark active... afer 2 minute 24th 23:57");
      timeTracker.markActive("LOOKUP_INFO");
    }, 1000 * 60 * 2);
    clock.tick(1000 * 60 * 2);

    console.log("Switch to next day");
    clock.setSystemTime(new Date("2024-07-25T00:00:00Z"));
    console.log("3️⃣: ", new Date());
    setTimeout(() => {
      console.log(
        "Mark inactive... afer 2 minute 25th 00:02 activetime: 7 minutes"
      );
      timeTracker.markInactive();
      console.log("timeTracker:", timeTracker.activePeriods);
    }, 1000 * 60 * 2);
    clock.tick(1000 * 60 * 2);

    setTimeout(() => {
      console.log("Mark active... afer 1 minute 25th 00:03");
      timeTracker.markActive("QUERY_EAN_EBY");
    }, 1000 * 60 * 1);
    clock.tick(1000 * 60 * 1);

    setTimeout(() => {
      console.log(
        "Mark inactive... afer 2 minute 25th 00:05 activetime: 4 minutes"
      );
      timeTracker.markInactive();
      console.log("timeTracker:", timeTracker.activePeriods);
    }, 1000 * 60 * 2);
    clock.tick(1000 * 60 * 2);

    clock.tick(1000 * 60 * 11);

    setTimeout(() => {
      console.log("Mark active... afer 1 minute 25th 00:06");
      timeTracker.markActive("CRAWL_EBY_LISTINGS");
    }, 1000 * 60 * 1);
    clock.tick(1000 * 60 * 1);

    setTimeout(() => {
      console.log(
        "Mark inactive... afer 2 minute 25th 00:08 activetime: 6 minutes"
      );
      timeTracker.markInactive();
      console.log("timeTracker:", timeTracker.activePeriods);
    }, 1000 * 60 * 2);
    clock.tick(1000 * 60 * 2);

    clock.tick(1000 * 60 * 11);

    setTimeout(() => {
      console.log("Mark active... afer 1 minute 25th 00:06");
      timeTracker.markActive("CRAWL_EBY_LISTINGS");
    }, 1000 * 60 * 1);
    clock.tick(1000 * 60 * 1);

    setTimeout(() => {
      console.log(
        "Mark inactive... afer 2 minute 25th 00:08 activetime: 6 minutes"
      );
      timeTracker.markInactive();
      console.log("timeTracker:", timeTracker.activePeriods);
    }, 1000 * 60 * 2);
    clock.tick(1000 * 60 * 2);

    console.log("Switch to next week");
    clock.setSystemTime(new Date("2024-08-01T16:04:00Z"));

    setTimeout(() => {
      console.log("Mark active... afer 1 minute 01th08 16:06");
      timeTracker.markActive("CRAWL_SHOP");
    }, 1000 * 60 * 2);
    clock.tick(1000 * 60 * 2);

    setTimeout(() => {
      console.log(
        "Mark inactive... afer 2 minute 01th08 16:08 activetime: 2 minutes"
      );
      timeTracker.markInactive();
      console.log("timeTracker:", timeTracker.activePeriods);
    }, 1000 * 60 * 2);
    clock.tick(1000 * 60 * 2);

    clock.tick(1000 * 60 * 11);
  });

  afterAll(() => {
    clock.restore();
  });
});
