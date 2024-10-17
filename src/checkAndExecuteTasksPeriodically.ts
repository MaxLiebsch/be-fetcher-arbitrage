import { LocalLogger, defaultLogDirectory } from "@dipmaxtech/clr-pkg";
import { monitorAndProcessTasks } from "./util/monitorAndProcessTasks.js";
import { logGlobal, setTaskLogger } from "./util/logger.js";
import { hostname } from "./db/mongo.js";
import { updateAllTasksProgress } from "./db/util/updateAllTasksProgress.js";
import { scheduleJob } from "node-schedule";
import { updateAllShopsStats } from "./db/util/updateShopStats.js";
import pkg from "fs-jetpack";
const { write } = pkg;
import { exec } from "child_process";

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

  scheduleJob("15 *  * * *", async () => {
    try {
      logGlobal(`Scheduled job: updateAll Shop Stats...`);
      await updateAllShopsStats();
      logGlobal(`Scheduled job: updateAll Shop Stats done...`);
    } catch (error) {
      logGlobal(`Scheduled job: updateAll Shop Stats failed: ${error}`);
    }
  });
}

scheduleJob("*/2 * * * *", async () => {
  write(defaultLogDirectory + "/heartbeat.log", new Date().toISOString(), {
    atomic: true,
  });
});

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
  const IsProtocolError = `${err}`.includes("ProtocolError");

  let type = "unhandledException";
  if (IsTargetError) {
    type = "TargetClosed";
  } else if (IsSessionError) {
    type = "SessionClosed";
  } else if (IsNavigationDetachedError) {
    type = "NavigationDetached";
  } else if (IsProtocolError) {
    type = "ProtocolError";
  }
  logGlobal(
    `Error: ${type} on ${hostname} taskId: ${taskId} error: ${err?.message}`
  );

  // Run pkill -f puppeteer when an error occurs
  exec("pkill -f puppeteer", (error, stdout, stderr) => {
    if (error) {
      logGlobal(`Error executing pkill: ${error.message}`);
      return;
    }
    if (stderr) {
      logGlobal(`pkill stderr: ${stderr}`);
      return;
    }
    logGlobal(`pkill stdout: ${stdout}`);
  });

  if (type === "unhandledException") {
    throw err; //unhandledException:  Re-throw all other errors
  } else {
    return;
  }

};
process.on("unhandledRejection", errorHandler);

process.on("uncaughtException", errorHandler);
