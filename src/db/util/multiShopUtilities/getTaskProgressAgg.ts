import { MultiShopTaskTypesWithAgg } from "../../../util/taskTypes.js";
import { getProductsCol } from "../../mongo.js";
import { progressAggs } from "./progressQueryFns.js";

export const countTotalProducts = async (
  domain: string,
  taskType: MultiShopTaskTypesWithAgg
) => {
  const productsCol = await getProductsCol();
  const aggregation = progressAggs[taskType].total(domain);
  return productsCol.aggregate(aggregation).toArray();
};

export const countPendingProductsAggFn = async (
  domain: string,
  taskType: MultiShopTaskTypesWithAgg
) => {
  const productsCol = await getProductsCol();
  const aggregation = progressAggs[taskType].pending({
    domain,
    returnTotal: true,
    limit: 0,
  });
  return productsCol.aggregate(aggregation).toArray();
};

export const getTaskProgressAgg = async (
  domain: string,
  taskType: MultiShopTaskTypesWithAgg
) => {
  const [pending] = await countPendingProductsAggFn(domain, taskType);
  const [total] = await countTotalProducts(domain, taskType);
  if (!pending || !total) {
    return {
      percentage: "0 %",
      pending: 0,
      total: 0,
    };
  }
  return {
    percentage: `${(
      ((total.total - pending.total) / total.total) *
      100
    ).toFixed(2)} %`,
    pending: pending.total,
    total: total.total,
  };
};
