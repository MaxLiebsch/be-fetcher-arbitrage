import { BaseStats } from "./TasksStats.js";

export interface ScrapeEanStats extends BaseStats {
  shops: { [key: string]: number };
  missingProperties: {
    [key: string]: {
      ean: number;
      image: number;
    };
  };
}
