import { getCrawlDataCollection } from "../db/mongo";

async function addNewScraper() {
  const scraper = [
  "root:185.163.119.221:UazRxc5xYsR9Me9:clr30"
  ]
  const db = await getCrawlDataCollection("metadata");

  const result = await db.insertMany(
    scraper.map((s) => {
      const [username, ip, password, name] = s.split(":");
      return {
        crawlerId: name,
        activityPeriods: {},
        ip,
        name: `Scraper ${name.split("clr")[1]}`,
      };
    })
  );

  if (result.insertedCount === scraper.length) {
    console.log("Scraper added successfully");
  } else {
    console.log("Failed to add scraper");
  }
}

addNewScraper()
  .then(() => process.exit(0))
  .catch(console.error);
