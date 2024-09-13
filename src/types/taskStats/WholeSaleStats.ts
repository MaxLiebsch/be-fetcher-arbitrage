import { BaseStats } from "./TasksStats";

export interface WholeSaleStats extends BaseStats {
  new: number;
  old: number;
  failedSave: number;
  missingProperties: {
    price: number;
    costs: number;
    infos: number;
  }
}
