import { BaseStats } from "./TasksStats";

export interface NegDealsOnAznStats extends BaseStats {
  notFound: number;
  scrapeProducts: ScrapeProducts;
  ebyListings: EbyListings;
  missingProperties: MissingPropertiesNegDealsOnAzn;
}

export interface ScrapeProducts {
  elapsedTime: string;
}

export interface EbyListings {
  elapsedTime: string;
}

export interface MissingPropertiesNegDealsOnAzn {
  infos: number;
  aznCostNeg: number;
  price: number;
}
