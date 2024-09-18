import os from "os";
import { LocalLogger } from "@dipmaxtech/clr-pkg";
import { monitorAndProcessTasks } from "./util/monitorAndProcessTasks.js";
import { logGlobal, setTaskLogger } from "./util/logger.js";

const hostname = os.hostname();
const logger = new LocalLogger().createLogger("GLOBAL");
setTaskLogger(logger, "GLOBAL"); // DEFAULT logger

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
