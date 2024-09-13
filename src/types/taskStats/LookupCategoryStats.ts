import { BaseStats } from "./TasksStats";

export interface LookupCategoryStats extends BaseStats {
  shops: { [key: string]: number }; 
}
