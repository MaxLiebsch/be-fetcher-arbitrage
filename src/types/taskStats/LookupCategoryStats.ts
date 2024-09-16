import { BaseStats } from "./TasksStats.js";

export interface LookupCategoryStats extends BaseStats {
  shops: { [key: string]: number }; 
}
