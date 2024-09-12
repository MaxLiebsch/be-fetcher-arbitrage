import { 
  ProxyType,
  QueueStats,
  TaskTypes,
  WithId,
} from "@dipmaxtech/clr-pkg";
import { DailySalesTask } from "./DailySalesTask";

export interface Category {
  name: string;
  link: string;
}

export interface Limit {
  mainCategory: number;
  subCategory: number;
  pages: number;
}

export type Action = 'recover' | 'none'


export interface Task extends WithId<Document> {
  type: TaskTypes;
  id: string;
  shopDomain: string;
  limit: Limit;
  action?: Action;
  recurrent: boolean;
  actualProductLimit?: number;
  statistics?: QueueStats;
  executing: boolean;
  completed: boolean;
  createdAt: string;
  errored: boolean;
  timezones?: string[];
  test: boolean;
  startedAt: string;
  completedAt: string;
  productLimit: number;
  retry: number;
  maintenance: boolean;
  lastCrawler: string[];
  cooldown: string;
}

export interface ScrapeShopTask extends Task {
  categories: Category[];
  weekday: number;
  visitedPages: any[];
  executing: boolean;
  concurrency?: number;
}

export interface Progress {
  shop: string;
  pending: number;
}

export interface ScrapeEansTask extends Task {}

export interface StartShop {
  d: string;
  prefix: string;
  name: string;
}

export interface MatchProductsTasks extends Task {
  extendedLookUp: boolean;
  startShops: StartShop[];
}

export interface MultipleShopTask extends Task {
  progress: Progress[];
}
export interface LookupInfoTask extends MultipleShopTask {}

export interface LookupCategoryTask extends MultipleShopTask {}

export interface QueryEansOnEbyTask extends MultipleShopTask {}

export interface DealOnAznTask extends MultipleShopTask {
  proxyType: ProxyType;
  concurrency: number;
}

export interface DealOnEbyTask extends MultipleShopTask {
  proxyType: ProxyType;
  concurrency: number;
}

export interface NegAznDealTask extends MultipleShopTask {
  proxyType: ProxyType;
  concurrency: number;
}

export interface NegEbyDealTask extends MultipleShopTask {
  proxyType: ProxyType;
  concurrency: number;
}

export interface WholeSaleTask extends MultipleShopTask {
  browserConcurrency: number;
}

export type Tasks =
  | ScrapeShopTask
  | ScrapeEansTask
  | MatchProductsTasks
  | LookupInfoTask
  | DailySalesTask
  | LookupCategoryTask
  | QueryEansOnEbyTask
  | DealOnAznTask
  | DealOnEbyTask
  | NegAznDealTask
  | NegEbyDealTask;
