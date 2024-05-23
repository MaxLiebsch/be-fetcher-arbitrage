import { sub } from "date-fns";
import { updateProducts } from "../src/service/db/util/crudArbispotterProduct.js";
import { findTask, updateTask } from "../src/service/db/util/tasks.js";
import { updateCrawlDataProducts } from "../src/service/db/util/crudCrawlDataProduct.js";

const shopDomain = "reichelt.de";
const type = "lookup";
const crawler = ["clr3", "clr4", "clr2", "clr1"];
const taskQuery = { id: `${type}_products_${shopDomain}` };

const main = async () => {
  const task = await findTask(taskQuery);
  if (!task) return "missing task";

  const startedAt = task?.startedAt
    ? sub(task.startedAt, { minutes: 15 })
    : sub(new Date(), { minutes: 15 });

  const lookup = type === "lookup";

  const res = await Promise.all(
    crawler.map(async (crawler) => {
      const update = lookup
        ? await updateProducts(
            shopDomain,
            {
              taskId: `${crawler}:${task._id.toString()}`,
            },
            {
              taskId: "",
              lckd: false,
            }
          )
        : await updateCrawlDataProducts(
            shopDomain,
            {
              taskId: `${crawler}:${task._id.toString()}`,
            },
            {
              taskId: "",
              locked: false,
            }
          );
      if (update.modifiedCount === 0) return "No products to update";
    })
  );

  await updateTask(task._id, {
    completedAt: "",
    lastCrawler: [],
    startedAt: startedAt.toISOString(),
    executing: false,
  });
  return res;
};

main().then((r) => {
  console.log(r);
  process.exit(0);
});
