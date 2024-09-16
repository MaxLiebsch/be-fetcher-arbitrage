import { BaseStats } from "./TasksStats.js";

export interface LookupInfoStats extends BaseStats {
  shops: { [key: string]: number }; 
  missingProperties: {
    price: number;
    costs: number;
    infos: number;
  }
}
