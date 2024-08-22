import match from "../services/match.js";
import crawl from "../services/crawl.js";
import scan from "../services/scan.js";
import crawlEan from "../services/crawlEan.js";
import lookupInfo from "../services/lookupInfo.js";
import wholesale from "../services/wholesale.js";
import queryEansOnEby from "../services/queryEansOnEby.js";
import lookupCategory from "../services/lookupCategory.js";
import { productPriceComperator } from "../services/productPriceComparator.js";
import dealsOnEby from "../services/deals/daily/dealsOnEby.js";
import dealsOnAzn from "../services/deals/daily/dealsOnAzn.js";
import negEbyDeals from "../services/deals/weekly/negEbyDeals.js";
import negAznDeals from "../services/deals/weekly/negAznDeals.js";

export async function executeTask(task) {
  const { type } = task;
  if (type === "DEALS_ON_EBY") {
    return await dealsOnEby(task);
  }
  if (type === "DEALS_ON_AZN") {
    return await dealsOnAzn(task);
  }
  if (type === "DAILY_SALES") {
    return await productPriceComperator(task);
  }
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
    return await negAznDeals(task);
  }
  if (type === "CRAWL_EBY_LISTINGS") {
    return await negEbyDeals(task);
  }
  if (type === "CRAWL_EAN") {
    return await crawlEan(task);
  }
  if (type === "LOOKUP_INFO") {
    return await lookupInfo(task);
  }
  if (type === "QUERY_EANS_EBY") {
    return await queryEansOnEby(task);
  }
  if (type === "LOOKUP_CATEGORY") {
    return await lookupCategory(task);
  }
}
