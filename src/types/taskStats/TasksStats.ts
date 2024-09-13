import { DealsOnAznStats } from "./DealsOnAznStats";
import { DealsOnEbyStats } from "./DealsOnEbyStats";
import { LookupCategoryStats } from "./LookupCategoryStats";
import { NegDealsOnAznStats } from "./NegDealsOnAzn";
import { NegDealsOnEbyStats } from "./NegDealsOnEby";
import { ScrapeEanStats } from "./ScrapeEanStats";
import { ScrapeShopStats } from "./ScrapeShopStats";
import { MatchProductsStats } from "./MatchProductsStats";
import { DailySalesStats } from "./DailySalesStats";

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
