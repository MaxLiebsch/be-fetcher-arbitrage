import { COOLDOWN } from "../constants.js";
import { hostname } from "../services/db/mongo.js";
import { updateShopStats } from "../services/db/util/shops.js";
import { updateTask } from "../services/db/util/tasks.js";

export const handleTaskCompleted = async (id, infos) => {
  const coolDownFactor = process.env.DEBUG ? 1000 * 60 * 2 : COOLDOWN;
  const cooldown = new Date(Date.now() + coolDownFactor).toISOString(); // 30 min in future
  console.log(infos);
  if (infos.shops) {
    const shopDomains = Object.keys(infos.shops);
    await Promise.all(
      shopDomains.map((shopDomain) => updateShopStats(shopDomain))
    );
  }
  const update = {
    cooldown,
    completedAt: new Date().toISOString(),
    retry: 0,
  };
  await updateTask(id, {
    $set: update,
    $pull: { lastCrawler: hostname },
  });
};
