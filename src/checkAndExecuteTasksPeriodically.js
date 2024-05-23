import { sendMail } from "./email.js";
import os from "os";
import { LoggerService } from "@dipmaxtech/clr-pkg";
import { monitorAndProcessTasks } from "./util/monitorAndProcessTasks.js";

const hostname = os.hostname();
const { errorLogger } = LoggerService.getSingleton();

let taskId = "";

monitorAndProcessTasks()
  .then()
  .catch((e) => {
    errorLogger.error(`Error: Queue failed on ${hostname} error: ${e}`);
    sendMail({
      subject: `Error: Queue failed on ${hostname}`,
      html: e,
    }).then();
  });

const errorHandler = (err, origin) => {
  const IsTargetError = `${err}`.includes("Target closed");
  const IsSessionError = `${err}`.includes("Session closed");
  const IsNavigationDetachedError = `${err}`.includes(
    "Navigating frame was detached"
  );

  const metaData = {
    reason: err?.stack || err,
    origin,
  };
  let type = "unhandledException";
  if (IsTargetError) {
    type = "TargetClosed";
  } else if (IsSessionError) {
    type = "SessionClosed";
  } else if (IsNavigationDetachedError) {
    type = "NavigationDetached";
  }
  errorLogger.error({
    type,
    hostname,
    taskId,
    created: new Date().toISOString(),
    ...metaData,
  });

  if (type === "unhandledException") {
    throw err; //unhandledException:  Re-throw all other errors
  } else {
    return;
  }
};
process.on("unhandledRejection", errorHandler);

process.on("uncaughtException", errorHandler);
