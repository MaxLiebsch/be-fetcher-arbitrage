import { getCrawlDataCollection } from "../db/mongo";

async function updateScrapeTasks() {
  const db = await getCrawlDataCollection("tasks");

  const tasks = await db.find({ type: "CRAWL_SHOP" }).toArray();

  for (const task of tasks) {
    const { _id, id, productLimit } = task;
    console.log(`Updating task ${id}`);
    await db.updateOne({ _id }, { $set: { estimatedProducts: productLimit } });
  }
}

updateScrapeTasks().then(() => {
  console.log("Scrape tasks updated");
  process.exit(0);
});
