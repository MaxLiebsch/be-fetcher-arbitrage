import { totalPositivEbay } from "@dipmaxtech/clr-pkg";
import { DEFAULT_LIMIT } from "../../constants.js";
import {
  ebayMarginCalculationAggregationStep,
 
} from "./queries.js";

const match = {
  $match: {
    eby_prop: "complete",
    e_pRange: {$exists: false},
    $or: [{ $and: totalPositivEbay.$and }],
  },
};

export const aggregation = [
  ...ebayMarginCalculationAggregationStep,
  match,
  { $limit: DEFAULT_LIMIT },
];

export const countAggregation = [
  ...ebayMarginCalculationAggregationStep,
  match,
  { $count: "total" },
];
