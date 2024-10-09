import { Task } from "./Tasks.js";
import { DbProductRecord, ICategory, ObjectId, ProxyType } from "@dipmaxtech/clr-pkg";

export interface Limit {
  subCategories: number;
  pages: number;
}

export interface Category {
  name: string;
  link: string;
}

export interface DailySalesTask extends Task {
  categories: Category[];
  executing: boolean;
  shopDomain: string;
  proxyType: ProxyType;
  actualProductLimit: number;
  crawlEan: DbProductRecord[];
  lookupInfo: DbProductRecord[];
  queryEansOnEby: DbProductRecord[];
  lookupCategory: DbProductRecord[];
  ebyListings: DbProductRecord[];
  aznListings: DbProductRecord[];
  progress: DailySalesProgress;
  browserConfig: BrowserConfig;
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
