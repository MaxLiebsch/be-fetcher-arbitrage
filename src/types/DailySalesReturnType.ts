import { QueueStats } from "@dipmaxtech/clr-pkg";
import { DealsOnEbyStats } from "./taskStats/DealsOnEbyStats";
import { ScrapeEanStats } from "./taskStats/ScrapeEanStats";
import { ScrapeShopStats } from "./taskStats/ScrapeShopStats";
import { LookupCategoryStats } from "./taskStats/LookupCategoryStats";
import { DealsOnAznStats } from "./taskStats/DealsOnAznStats";

export interface DailySalesReturnType {
  infos: ScrapeEanStats | DealsOnEbyStats | ScrapeShopStats | LookupCategoryStats | DealsOnAznStats
  queueStats: QueueStats;
}
