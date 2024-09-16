import { DealsOnAznStats } from "./DealsOnAznStats.js";
import { DealsOnEbyStats } from "./DealsOnEbyStats.js";
import { LookupCategoryStats } from "./LookupCategoryStats.js";
import { NegDealsOnAznStats } from "./NegDealsOnAzn.js";
import { NegDealsOnEbyStats } from "./NegDealsOnEby.js";
import { ScrapeEanStats } from "./ScrapeEanStats.js";
import { ScrapeShopStats } from "./ScrapeShopStats.js";
import { MatchProductsStats } from "./MatchProductsStats.js";
import { DailySalesStats } from "./DailySalesStats.js";

//TODO add all the stats
export type TaskStats =
  | ScrapeShopStats
  | ScrapeEanStats
  | DailySalesStats
  | DealsOnAznStats
  | MatchProductsStats
  | LookupCategoryStats
  | DealsOnEbyStats
  | NegDealsOnEbyStats
  | NegDealsOnAznStats;

export interface BaseStats {
  total: number;
  locked: number;
  notFound: number;
  elapsedTime: string;
}
