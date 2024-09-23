import { BaseStats } from "./TasksStats.js";

export interface WholeSaleEbyStats extends BaseStats {
  lookupCategory: LookupCategory;
  queryEansOnEby: QueryEansOnEby;
}

export interface LookupCategory {
  elapsedTime: string;
}

export interface QueryEansOnEby {
  elapsedTime: string;
}
