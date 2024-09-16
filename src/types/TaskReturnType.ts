import { TaskErrors } from "../errors.js";
import { TaskCompletedStatus } from "../status.js";

export type TaskReturnType = Promise<TaskCompletedStatus | TaskErrors> 
