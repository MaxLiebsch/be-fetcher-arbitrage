import { deliveryTime, safeParsePrice } from "@dipmaxtech/clr-pkg";
import {
  deleteArbispotterProduct,
  insertArbispotterProduct,
  moveArbispotterProduct,
  updateArbispotterProductQuery,
} from "../services/db/util/crudArbispotterProduct.js";
import { createHash } from "./hash.js";

export async function handleCrawlEanProductInfo(
  collectionName,
  { productInfo, url },
  queue,
  product,
  infos,
  task = null,
) {
  const { lnk: productLink } = product;
  infos.shops[collectionName]++;
  infos.total++;
  queue.total++;
  if (productInfo) {
    const infoMap = new Map();
    productInfo.forEach((info) => infoMap.set(info.key, info.value));
    let ean = infoMap.get("ean");
    let isEan =
      ean && /\b[0-9]{12,13}\b/.test(ean) && !ean.toString().startsWith("99");

    if (isEan) {
      const prc = safeParsePrice(infoMap.get("price") ?? 0);
      const sku = infoMap.get("sku");
      const image = infoMap.get("image");
      const mku = infoMap.get("mku");
      const inStock = infoMap.get("instock");

      const productUpdate = {
        eanUpdatedAt: new Date().toISOString(),
        ean_prop: "found",
        ean,
        ...(prc && { prc }),
        ...(image && { img: image }),
        ...(sku && { sku }),
        ...(mku && { mku }),
      };
      if(task){
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
          await insertArbispotterProduct(collectionName, {
            ...product,
            ...productUpdate,
            lnk: url,
            s_hash,
          });
        }
      }
    } else {
      infos.missingProperties[collectionName]["ean"]++;
      const productUpdate = {
        eanUpdatedAt: new Date().toISOString(),
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
        eanUpdatedAt: new Date().toISOString(),
      },
      $unset: {
        ean_taskId: "",
      },
    });
  }
}
export async function handleCrawlEanNotFound(
  collection,
  infos,
  queue,
  cause,
  productLink
) {
  infos.notFound++;
  infos.shops[collection]++;
  infos.total++;
  queue.total++;
  if (cause === "timeout") {
    await updateArbispotterProductQuery(collection, productLink, {
      $set: {
        ean_prop: "timeout",
        eanUpdatedAt: new Date().toISOString(),
      },
      $unset: {
        ean_taskId: "",
      },
    });
  } else {
    await moveArbispotterProduct(collection, "grave", productLink);
  }
}
