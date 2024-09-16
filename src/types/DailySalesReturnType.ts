import { QueueStats } from "@dipmaxtech/clr-pkg";
import { DealsOnEbyStats } from "./taskStats/DealsOnEbyStats.js";
import { ScrapeEanStats } from "./taskStats/ScrapeEanStats.js";
import { ScrapeShopStats } from "./taskStats/ScrapeShopStats.js";
import { LookupCategoryStats } from "./taskStats/LookupCategoryStats.js";
import { DealsOnAznStats } from "./taskStats/DealsOnAznStats.js";

export interface DailySalesReturnType {
  infos: ScrapeEanStats | DealsOnEbyStats | ScrapeShopStats | LookupCategoryStats | DealsOnAznStats
  queueStats: QueueStats;
}
