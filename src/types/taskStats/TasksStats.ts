import { DealsOnAznStats } from "./DealsOnAznStats";
import { DealsOnEbyStats } from "./DealsOnEbyStats";
import { NegDealsOnAznStats } from "./NegDealsOnAzn";
import { NegDealsOnEbyStats } from "./NegDealsOnEby";
import { ScrapeShopStats } from "./ScrapeShopStats";

//TODO add all the stats
export type TaskStats =
  | ScrapeShopStats
  | DealsOnAznStats
  | DealsOnEbyStats
  | NegDealsOnEbyStats
  | NegDealsOnAznStats;

export interface BaseStats {
  total: number;
  locked: number;
  notFound: number;
  elapsedTime: string;
  shops?: string[];
}
