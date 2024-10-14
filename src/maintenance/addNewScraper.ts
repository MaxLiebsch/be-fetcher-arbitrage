import { add } from "date-fns";
import { getCrawlDataCollection } from "../db/mongo";

async function addNewScraper() {
  const scraper = [
    "root:45.142.177.125:nswiocslGUl0nia:clr16",
    "root:185.163.117.176:OTdKsJv8Y9rIT27:clr17",
    "root:37.120.173.173:r9gH1E42epP2qiU:clr18",
    "root:202.61.224.167:6W2Upk4CqmgQ0re:clr19",
    "root:5.252.226.183:Vu3jVVyRkaYNzfp:clr20",
    "root:185.163.118.92:90COXPP7d9CuEUW:clr21",
  ];

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

addNewScraper().then(() => process.exit(0)).catch(console.error);
