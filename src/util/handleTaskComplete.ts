import { UTCDate } from "@date-fns/utc";
import { COOLDOWN } from "../constants.js";
import { hostname } from "../db/mongo.js";
import { updateTask } from "../db/util/tasks.js";
import { TaskStats } from "../types/taskStats/TasksStats.js";
import { ObjectId } from "@dipmaxtech/clr-pkg";

export const handleTaskCompleted = async (
  id: ObjectId,
  infos: TaskStats,
  additionalUpdate = {}
) => {
  const coolDownFactor = process.env.DEBUG ? 1000 * 60 * 2 : COOLDOWN;
  const cooldown = new UTCDate(Date.now() + coolDownFactor).toISOString(); // 30 min in future
  let update = {
    cooldown,
    completedAt: new UTCDate().toISOString(),
    retry: 0,
  };
  if (Object.keys(additionalUpdate).length > 0) {
    update = { ...update, ...additionalUpdate };
  }

  await updateTask(id, {
    $set: update,
    $pull: { lastCrawler: hostname },
  });
};
