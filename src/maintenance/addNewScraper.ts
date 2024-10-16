import { getCrawlDataCollection } from "../db/mongo";

async function addNewScraper() {
  const scraper = [
    "root:194.13.82.185:NEwBpRH5Kr3FyIB:clr22",
    "root:45.132.246.8:z7UAEaDY9QrXWot:clr23",
    "root:85.209.50.143:RvVEQZKnTzv7Bva:clr24",
    "root:194.13.82.40:RanRVL1CXWv11OV:clr25",
    "root:45.142.178.8:36dbNw7PezuUtzQ:clr26",
    "root:45.9.63.184:Tkv3kTrNiU3yeqc:clr27",
    "root:188.68.36.192:3SEvwhMPwJY9AHO:clr28",
    "root:192.145.46.18:wyIyi5yOjxxEjOj:clr29",
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

addNewScraper()
  .then(() => process.exit(0))
  .catch(console.error);
