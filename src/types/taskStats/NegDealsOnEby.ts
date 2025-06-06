import { BaseStats } from "./TasksStats.js";

export interface NegDealsOnEbyStats extends BaseStats {
 notFound: number;
  missingProperties: MissingPropertiesNegDealsOnEby;
}

export interface MissingPropertiesNegDealsOnEby {
  mappedCat: number;
  calculationFailed: number;
  name: number;
  price: number;
  link: number;
  image: number;
}
