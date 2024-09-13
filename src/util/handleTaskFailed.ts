import { UTCDate } from "@date-fns/utc";
import { COOLDOWN, COOLDOWN_MULTIPLIER, MAX_TASK_RETRIES } from "../constants";
import { hostname } from "../db/mongo";
import { updateTask } from "../db/util/tasks";
import { ObjectId } from "@dipmaxtech/clr-pkg";
import { Task } from "../types/tasks/Tasks";

export const handleTaskFailed = async (id: ObjectId, retry: number) => {
  const coolDownFactor = process.env.DEBUG ? 1000 * 60 * 2 : COOLDOWN;
  const cooldown = new UTCDate(Date.now() + coolDownFactor).toISOString(); // 30 min in future

  const update: Partial<Task> = {
    cooldown,
    executing: false,
  };
  if (retry < MAX_TASK_RETRIES) {
    update["retry"] = retry + 1;
    update["completedAt"] = "";
  } else {
    update["cooldown"] = new UTCDate(
      Date.now() + COOLDOWN * COOLDOWN_MULTIPLIER
    ).toISOString();
    update["completedAt"] = new UTCDate().toISOString();
    update["retry"] = 0;
  }

  await updateTask(id, {
    $set: update,
    $pull: { lastCrawler: hostname },
  });
};
