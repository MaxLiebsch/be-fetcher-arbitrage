import { createCrawlEbyListingsTask } from "../../__test__/endToEnd.test.js";
import { getActiveShops } from "../db/util/shops.js";
import { addTask } from "../db/util/tasks.js";

const createEbyListingTask = async () => {
  const activeShops = await getActiveShops();
  const result = await Promise.all(
    activeShops.map(async (shop) => {
      const shopDomain = shop.d;

      const task = createCrawlEbyListingsTask(shopDomain, 500);

      return addTask(task);
    })
  );

  if (result) {
    console.log("task creation completed");
  }
};

createEbyListingTask().then((r) => {
  console.log("first task completed!");
  process.exit(0);
});
