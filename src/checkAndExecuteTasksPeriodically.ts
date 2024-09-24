import { LocalLogger } from "@dipmaxtech/clr-pkg";
import { monitorAndProcessTasks } from "./util/monitorAndProcessTasks.js";
import { logGlobal, setTaskLogger } from "./util/logger.js";
import { hostname } from "./db/mongo.js";
import { updateAllTasksProgress } from "./db/util/updateAllTasksProgress.js";
import { scheduleJob } from "node-schedule";

const logger = new LocalLogger().createLogger("GLOBAL");
setTaskLogger(logger, "GLOBAL"); // DEFAULT logger

if (hostname === "clr1") {
  scheduleJob("42 * * * *", async () => {
    try {
      logGlobal(`Scheduled job: updateAllTasksProgress...`);
      await updateAllTasksProgress();
      logGlobal(`Scheduled job: updateAllTasksProgress done...`);
    } catch (error) {
      logGlobal(`Scheduled job: updateAllTasksProgress failed: ${error}`);
    }
  });
}

let taskId = "";

monitorAndProcessTasks()
  .then()
  .catch((e) => {
    logGlobal(`Error: Queue failed on ${hostname} error: ${e.message}`);
  });

const errorHandler = (err: any, origin: any) => {
  const IsTargetError = `${err}`.includes("Target closed");
  const IsSessionError = `${err}`.includes("Session closed");
  const IsNavigationDetachedError = `${err}`.includes(
    "Navigating frame was detached"
  );

  let type = "unhandledException";
  if (IsTargetError) {
    type = "TargetClosed";
  } else if (IsSessionError) {
    type = "SessionClosed";
  } else if (IsNavigationDetachedError) {
    type = "NavigationDetached";
  }
  logGlobal(
    `Error: ${type} on ${hostname} taskId: ${taskId} error: ${err?.message}`
  );
  if (type === "unhandledException") {
    throw err; //unhandledException:  Re-throw all other errors
  } else {
    return;
  }
};
process.on("unhandledRejection", errorHandler);

process.on("uncaughtException", errorHandler);