import match from "../services/match.js";
import crawlAznListings from "../services/crawlAznListings.js";
import crawl from "../services/crawl.js";
import scan from "../services/scan.js";
import crawlEan from "../services/crawlEan.js";
import lookupInfo from "../services/lookupInfo.js";
import wholesale from "../services/wholesale.js";

export async function executeTask(task) {
  const { type } = task;
  if (type === "CRAWL_SHOP") {
    return await crawl(task);
  }
  if (type === "WHOLESALE_SEARCH") {
    return await wholesale(task);
  }
  if (type === "SCAN_SHOP") {
    return await scan(task);
  }
  if (type === "MATCH_PRODUCTS") {
    return await match(task);
  }
  if (type === "CRAWL_AZN_LISTINGS") {
    return await crawlAznListings(task);
  }
  if (type === "CRAWL_EAN") {
    return await crawlEan(task);
  }
  if (type === "LOOKUP_INFO") {
    return await lookupInfo(task);

  }
}