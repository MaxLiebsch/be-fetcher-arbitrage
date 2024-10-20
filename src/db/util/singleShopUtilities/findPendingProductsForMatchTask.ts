import { ObjectId, TaskTypes } from "@dipmaxtech/clr-pkg";
import { Action } from "../../../types/tasks/Tasks.js";
import { log } from "../../../util/logger.js";
import { lockProducts } from "../multiShopUtilities/lockProducts.js";
import { findProducts } from "../crudProducts.js";
import { setTaskId } from "../queries.js";

export async function findPendingProductsForMatchTask(
  taskType: TaskTypes,
  shopDomain: string,
  taskId: ObjectId,
  action: Action,
  productLimit: number,
  hasEan?: boolean
) {
  if (action === "recover") {
    const products = await findProducts(
      { taskId: setTaskId(taskId), sdmn: shopDomain },
      productLimit
    );
    log(`Missing ${taskType}: ${shopDomain}: p: ${products.length} `);
    return products;
  } else {
    const products = await lockProducts(
      "MATCH_PRODUCTS",
      shopDomain,
      productLimit,
      action || "none",
      taskId,
      Boolean(hasEan)
    );

    return products;
  }
}
