
import { COOLDOWN, COOLDOWN_MULTIPLIER, MAX_TASK_RETRIES } from "../constants.js";
import { hostname } from "../db/mongo.js";
import { updateTask } from "../db/util/tasks.js";
import { ObjectId } from "@dipmaxtech/clr-pkg";
import { Task } from "../types/tasks/Tasks.js";

export const handleTaskFailed = async (id: ObjectId, retry: number) => {
  const coolDownFactor = process.env.DEBUG ? 1000 * 60 * 2 : COOLDOWN;
  const cooldown = new Date(Date.now() + coolDownFactor).toISOString(); // 30 min in future

  const update: Partial<Task> = {
    cooldown,
    executing: false,
  };
  if (retry < MAX_TASK_RETRIES) {
    update["retry"] = retry + 1;
    update["completedAt"] = "";
  } else {
    update["cooldown"] = new Date(
      Date.now() + COOLDOWN * COOLDOWN_MULTIPLIER
    ).toISOString();  // three hours in future
    update["completedAt"] = new Date().toISOString();
    update["retry"] = 0;
  }

  await updateTask(id, {
    $set: update,
    $pull: { lastCrawler: hostname },
  });
};
