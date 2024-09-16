import { DbProductRecord, DeleteResult } from "@dipmaxtech/clr-pkg";
import { InsertOneResult, UpdateResult } from "mongodb";
import pino from "pino";

// Create a placeholder for the task logger instance
let taskLogger: pino.Logger | null = null;

// Function to set the logger for the current task
export function setTaskLogger(logger: pino.Logger | null) {
  taskLogger = logger;
}

// Function to get the current task logger
export function getTaskLogger() {
  return taskLogger;
}

export function log(
  message: string,
  result?:
    | UpdateResult<DbProductRecord>
    | InsertOneResult<Document>
    | DeleteResult
) {
  const logger = getTaskLogger();
  let resultStr = "";

  if (result) {
    if ("modifiedCount" in result) {
      resultStr = ` Operation: ${result.modifiedCount} document(s) modified.`;
    } else if ("insertedId" in result) {
      resultStr = ` Operation: Document inserted with ID ${result.insertedId}.`;
    } else if ("deletedCount" in result) {
      resultStr = ` Operation: ${result.deletedCount} document(s) deleted.`;
    }
  }
  const _message = message + resultStr;

  logger?.info(_message);
}
