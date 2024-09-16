import { BaseStats } from "./TasksStats.js"

export interface DailySalesStats extends BaseStats {
    crawlProducts: CrawlProducts
    crawlEan: CrawlEan
    lookupInfo: LookupInfo
    lookupCategory: LookupCategory
    queryEansOnEby: QueryEansOnEby
    aznListings: AznListings
    ebyListings: EbyListings
  }
  
  export interface CrawlProducts {
    elapsedTime: string
  }
  
  export interface CrawlEan {
    elapsedTime: string
  }
  
  export interface LookupInfo {
    elapsedTime: string
  }
  
  export interface LookupCategory {
    elapsedTime: string
  }
  
  export interface QueryEansOnEby {
    elapsedTime: string
  }
  
  export interface AznListings {
    elapsedTime: string
  }
  
  export interface EbyListings {
    elapsedTime: string
  }
