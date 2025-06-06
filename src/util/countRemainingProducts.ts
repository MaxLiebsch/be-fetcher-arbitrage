import { ObjectId, TaskTypes } from "@dipmaxtech/clr-pkg";
import { countProducts } from "../db/util/crudProducts.js";
import { PendingShops } from "../types/shops.js";
import { setTaskId } from "../db/util/queries.js";

const taskIds: { [key in TaskTypes]: string } = {
  LOOKUP_INFO: "info_taskId",
  LOOKUP_CATEGORY: "cat_taskId",
  QUERY_EANS_EBY: "eby_taskId",
  CRAWL_EAN: "ean_taskId",
  WHOLESALE_EBY_SEARCH: "eby_taskId",
  DAILY_SALES: "",
  MATCH_PRODUCTS: "taskId",
  SCAN_SHOP: "",
  WHOLESALE_SEARCH: "taskId",
  CRAWL_AZN_LISTINGS: "azn_taskId",
  CRAWL_EBY_LISTINGS: "eby_taskId",
  DEALS_ON_AZN: "aznDealTaskId",
  DEALS_ON_EBY: "ebyDealTaskId",
  CRAWL_SHOP: "",
};

export async function countRemainingProducts(
  pendingShops: PendingShops,
  taskId: ObjectId,
  taskType: TaskTypes
) {
  let totalRemaining = 0;
  for (const shop of pendingShops) {
    const remaining = await countProducts({
      sdmn: shop.shop.d,
      [taskIds[taskType]]: setTaskId(taskId),
    });
    totalRemaining += remaining;
  }
  return totalRemaining;
}

export async function countRemainingProductsShop(
  shop: string,
  taskId: ObjectId,
  taskType: TaskTypes
) {
  return await countProducts({
    sdmn: shop,
    [taskIds[taskType]]: setTaskId(taskId),
  });
}
