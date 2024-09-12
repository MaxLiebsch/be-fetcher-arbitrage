import { BaseStats } from "./TasksStats"

export interface DealsOnEbyStats extends BaseStats {
    new: number
    old: number
    notFound: number
    scrapeProducts: ScrapeProducts
    ebyListings: EbyListings
    missingProperties: MissingProperties
  }
  
  export interface ScrapeProducts {
    elapsedTime: string
  }
  
  export interface EbyListings {
    elapsedTime: string
  }
  
  export interface MissingProperties {
    bsr: number
    mappedCat: number
    calculationFailed: number
    name: number
    price: number
    link: number
    image: number
  }