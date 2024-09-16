import { BaseStats } from "./TasksStats.js";

export interface DealsOnAznStats extends BaseStats {
  new: number;
  old: number;
  notFound: number;
  scrapeProducts: ScrapeProducts;
  aznListings: AznListings;
  missingProperties: MissingProperties;
}

export interface ScrapeProducts {
  elapsedTime: string;
}

export interface AznListings {
  elapsedTime: string;
}

export interface MissingProperties {
  bsr: number;
  mappedCat: number;
  calculationFailed: number;
  aznCostNeg: number;
  infos: number;
  name: number;
  price: number;
  link: number;
  image: number;
}
