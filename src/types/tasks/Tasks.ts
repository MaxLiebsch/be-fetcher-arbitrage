import {
  DbProductRecord,
  ObjectId,
  QueueStats,
  TaskTypes,
} from "@dipmaxtech/clr-pkg";
import {
  BrowserConfig,
  DailySalesProgress,
  DailySalesTask,
} from "./DailySalesTask.js";

export interface Category {
  name: string;
  link: string;
}

export interface Limit {
  mainCategory: number;
  subCategory: number;
  pages: number;
}

export type Action = "recover" | "none";

type WithId<T> = T & { _id: ObjectId };

export interface Task extends WithId<Document> {
  type: TaskTypes;
  id: string;
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

export interface ShopSpecificTask extends Task, MultiShopMultiQueueTask {
  shopDomain: string;
}

export interface ScrapeShopTask extends ShopSpecificTask {
  categories: Category[];
  weekday: number;
  visitedPages: any[];
  executing: boolean;
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

export interface MatchProductsTask extends ShopSpecificTask {
  extendedLookUp: boolean;
  startShops: StartShop[];
  concurrency: number;
}

export interface MultipleShopTask extends Task {
  progress: Progress[];
}

export interface MultiShopMultiQueueTask extends MultipleShopTask {
  browserConcurrency: number;
  concurrency: number;
}

export interface ScrapeEansTask extends MultipleShopTask {
  concurrency: number;
}
export interface LookupInfoTask extends MultiShopMultiQueueTask {}

export interface LookupCategoryTask extends MultipleShopTask {
  concurrency: number;
}

export interface QueryEansOnEbyTask extends MultipleShopTask {
  concurrency: number;
}

export interface DealOnAznTask extends MultipleShopTask {
  concurrency: number;
}

export interface DealOnEbyTask extends MultipleShopTask {
  concurrency: number;
}

export interface NegAznDealTask extends MultipleShopTask {
  concurrency: number;
}

export interface NegEbyDealTask extends MultipleShopTask {
  concurrency: number;
}

export interface WholeSaleTask extends MultiShopMultiQueueTask {
  userId: string;
  clrName: string[]
}

export interface WholeSaleEbyTask extends Task {
  shopDomain: string;
  clrName: string[]
  queryEansOnEby: DbProductRecord[];
  lookupCategory: DbProductRecord[];
  progress: Pick<DailySalesProgress, "queryEansOnEby" | "lookupCategory">;
  browserConfig: Pick<BrowserConfig, "queryEansOnEby" | "lookupCategory">;
}

export interface ScanTask extends ShopSpecificTask {
  concurrency: number;
}

export type Tasks =
  | ScrapeShopTask
  | ScrapeEansTask
  | MatchProductsTask
  | LookupInfoTask
  | ScanTask
  | WholeSaleEbyTask
  | WholeSaleTask
  | DailySalesTask
  | LookupCategoryTask
  | QueryEansOnEbyTask
  | DealOnAznTask
  | DealOnEbyTask
  | NegAznDealTask
  | NegEbyDealTask;
