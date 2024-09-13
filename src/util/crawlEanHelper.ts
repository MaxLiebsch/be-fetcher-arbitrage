import {
  AddProductInfoProps,
  DbProductRecord,
  deliveryTime,
  detectCurrency,
  NotFoundCause,
  QueryQueue,
  roundToTwoDecimals,
  safeParsePrice,
} from "@dipmaxtech/clr-pkg";
import {
  deleteArbispotterProduct,
  insertArbispotterProduct,
  moveArbispotterProduct,
  updateArbispotterProductQuery,
} from "../db/util/crudArbispotterProduct";
import { createHash } from "./hash.js";
import { UTCDate } from "@date-fns/utc";
import { ScrapeEanStats } from "../types/taskStats/ScrapeEanStats";
import { ScrapeEansTask } from "../types/tasks/Tasks";
import { DailySalesTask } from "../types/tasks/DailySalesTask";

export async function handleCrawlEanProductInfo(
  collectionName: string,
  { productInfo, url }: AddProductInfoProps,
  queue: QueryQueue,
  product: DbProductRecord,
  taskStats: ScrapeEanStats,
  task: ScrapeEansTask | DailySalesTask | null = null
) {
  const { lnk: productLink, qty: buyQty } = product;
  taskStats.shops![collectionName]++;
  taskStats.total++;
  queue.total++;
  if (productInfo) {
    const infoMap = new Map();
    productInfo.forEach((info) => infoMap.set(info.key, info.value));
    let ean = infoMap.get("ean");
    let isEan =
      ean && /\b[0-9]{12,13}\b/.test(ean) && !ean.toString().startsWith("99");

    if (isEan) {
      const rawPrice = infoMap.get("price");
      const prc = safeParsePrice(rawPrice || 0);
      const currency = detectCurrency(rawPrice);
      const sku = infoMap.get("sku");
      const image = infoMap.get("image");
      const mku = infoMap.get("mku");
      const inStock = infoMap.get("instock");

      const productUpdate = {
        eanUpdatedAt: new UTCDate().toISOString(),
        ean_prop: "found",
        ean,
        eanList: [ean],
        ...(prc && { prc, uprc: roundToTwoDecimals(prc / buyQty) }),
        ...(currency && { cur: currency }),
        ...(image && { img: image }),
        ...(sku && { sku }),
        ...(mku && { mku }),
      };
      if (task && "queryEansOnEby" in task.progress) {
        task.progress.queryEansOnEby.push(product._id);
        task.progress.lookupInfo.push(product._id);
      }
      if (inStock) {
        const stockStr = deliveryTime(inStock);
        if (stockStr) {
          productUpdate["a"] = stockStr;
        }
      }

      if (url === productLink) {
        await updateArbispotterProductQuery(collectionName, productLink, {
          $set: productUpdate,
          $unset: { ean_taskId: "" },
        });
      } else {
        const result = await deleteArbispotterProduct(
          collectionName,
          productLink
        );
        if (result.deletedCount === 1) {
          const s_hash = createHash(url);
          delete product.ean_taskId;
          await insertArbispotterProduct(collectionName, {
            ...product,
            ...productUpdate,
            lnk: url,
            s_hash,
          });
        }
      }
    } else {
      taskStats.missingProperties[collectionName]["ean"]++;
      const productUpdate = {
        eanUpdatedAt: new UTCDate().toISOString(),
        ean_prop: ean ? "invalid" : "missing",
      };
      await updateArbispotterProductQuery(collectionName, productLink, {
        $set: productUpdate,
        $unset: { ean_taskId: "" },
      });
    }
  } else {
    await updateArbispotterProductQuery(collectionName, productLink, {
      $set: {
        ean_prop: "invalid",
        eanUpdatedAt: new UTCDate().toISOString(),
      },
      $unset: {
        ean_taskId: "",
      },
    });
  }
}
export async function handleCrawlEanNotFound(
  collection: string,
  cause: NotFoundCause,
  productLink: string,
) {
  if (cause === "timeout") {
    await updateArbispotterProductQuery(collection, productLink, {
      $set: {
        ean_prop: "timeout",
        eanUpdatedAt: new UTCDate().toISOString(),
      },
      $unset: {
        ean_taskId: "",
      },
    });
  } else {
    await moveArbispotterProduct(collection, "grave", productLink);
  }
}
