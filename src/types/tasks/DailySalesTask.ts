import { Task } from './Tasks.js';
import { DbProductRecord, ObjectId } from '@dipmaxtech/clr-pkg';

export interface Limit {
  subCategories: number;
  pages: number;
}

export interface Category {
  name: string;
  skipSubCategories?: boolean;
  link: string;
}

export type CurrentStepDailySales =
  | 'CRAWL_SHOP'
  | 'CRAWL_EAN'
  | 'LOOKUP_INFO'
  | 'QUERY_EANS_EBY'
  | 'LOOKUP_CATEGORY'
  | 'CRAWL_AZN_LISTINGS'
  | 'CRAWL_EBY_LISTINGS';

export interface DailySalesTask extends Task {
  categories: Category[];
  executing: boolean;
  shopDomain: string;
  currentStep?:CurrentStepDailySales;
  actualProductLimit: number;
  crawlEan: DbProductRecord[];
  lookupInfo: DbProductRecord[];
  queryEansOnEby: DbProductRecord[];
  lookupCategory: DbProductRecord[];
  ebyListings: DbProductRecord[];
  aznListings: DbProductRecord[];
  progress: DailySalesProgress;
  browserConfig: BrowserConfig;
  lastTotal: number;
  estimatedTotal: number;
}
export interface DailySalesProgress {
  crawlEan: ObjectId[];
  lookupInfo: ObjectId[];
  lookupCategory: ObjectId[];
  queryEansOnEby: ObjectId[];
  aznListings: ObjectId[];
  ebyListings: ObjectId[];
}

export interface BrowserConfig {
  crawlShop: CrawlShop;
  crawlEan: CrawlEan;
  lookupInfo: LookupInfo;
  queryEansOnEby: QueryEansOnEby;
  lookupCategory: LookupCategory;
  crawlAznListings: CrawlAznListings;
  crawlEbyListings: CrawlEbyListings;
}

export interface CrawlShop {
  concurrency: number;
  limit: Limit2;
}

export interface Limit2 {
  pages: number;
  subCategory: number;
  mainCategory: number;
}

export interface CrawlEan {
  productLimit: number;
  concurrency: number;
}

export interface LookupInfo {
  concurrency: number;
  productLimit: number;
  browserConcurrency: number;
}

export interface QueryEansOnEby {
  concurrency: number;
  productLimit: number;
}

export interface LookupCategory {
  concurrency: number;
  productLimit: number;
}

export interface CrawlAznListings {
  concurrency: number;
  productLimit: number;
}

export interface CrawlEbyListings {
  concurrency: number;
  productLimit: number;
}
