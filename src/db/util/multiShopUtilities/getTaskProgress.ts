import { MultiShopTaskProgressQueries, MultiShopTaskTypes } from "../../../util/taskTypes.js";
import { getProductsCol } from "../../mongo.js";
import { progressQueries } from "./progressQueries.js";

export const countTotalProducts = async (
  domain: string,
  multiShopTask: MultiShopTaskProgressQueries,
  hasEan?: boolean
) => {
  const productsCol = await getProductsCol();
  const query = progressQueries[multiShopTask].pending;
  return productsCol.countDocuments(query(domain, hasEan));
};

export const countPendingProducts = async (
  domain: string,
  multiShopTask: MultiShopTaskProgressQueries,
  hasEan?: boolean
) => {
  const productsCol = await getProductsCol();
  const query = progressQueries[multiShopTask].pending;
  return productsCol.countDocuments(query(domain, hasEan));
};

export const getTaskProgress = async (
  domain: string,
  multiShopTask: MultiShopTaskProgressQueries,
  hasEan?: boolean
) => {
  const pending = await countPendingProducts(domain, multiShopTask, hasEan);
  const total = await countTotalProducts(domain, multiShopTask);

  return {
    percentage: `${(((total - pending) / total) * 100).toFixed(2)} %`,
    pending,
    total,
  };
};
