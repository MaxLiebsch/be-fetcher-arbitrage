import { UTCDate } from "@date-fns/utc";
import { COOLDOWN } from "../constants.js";
import { hostname } from "../services/db/mongo.js";
import { updateShopStats } from "../services/db/util/shops.js";
import { updateTask } from "../services/db/util/tasks.js";

export const handleTaskCompleted = async (id, infos, additionalUpdate = {}) => {
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
  if (infos.shops) {
    const shopDomains = Object.keys(infos.shops);
    await Promise.all(
      shopDomains.map((shopDomain) => updateShopStats(shopDomain))
    );
  }
  await updateTask(id, {
    $set: update,
    $pull: { lastCrawler: hostname },
  });
};
