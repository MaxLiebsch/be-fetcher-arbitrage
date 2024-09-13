import { TaskErrors } from "../errors";
import { TaskCompletedStatus } from "../status";

export type TaskReturnType = Promise<TaskCompletedStatus | TaskErrors> 