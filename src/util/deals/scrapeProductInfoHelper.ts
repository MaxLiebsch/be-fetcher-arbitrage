import {
  AddProductInfoProps,
  DbProductRecord,
  deliveryTime,
  detectCurrency,
  prefixLink,
  roundToTwoDecimals,
  safeParsePrice,
  Shop,
} from "@dipmaxtech/clr-pkg";

import { updateProductWithQuery } from "../../db/util/crudProducts.js";
import { log } from "../logger.js";

export async function handleDealsProductInfo(
  collection: string,
  { productInfo, url }: AddProductInfoProps,
  product: DbProductRecord,
  source: Shop
): Promise<Partial<DbProductRecord> | null> {
  const { _id: productId, qty: buyQty } = product;
  if (productInfo) {
    const infoMap = new Map();
    productInfo.forEach((info) => infoMap.set(info.key, info.value));
    const rawPrice = infoMap.get("price");
    const inStock = infoMap.get("instock");
    const sku = infoMap.get("sku");
    const image = infoMap.get("image");
    const mku = infoMap.get("mku");

    const prc = safeParsePrice(rawPrice || 0);
    const currency = detectCurrency(rawPrice);
    const parsedDeliveryTime = deliveryTime(inStock || "");

    const productUpdate = {
      availUpdatedAt: new Date().toISOString(),
      ...(parsedDeliveryTime && { a: parsedDeliveryTime }),
      ...(currency && { cur: currency }),
      ...(prc && { prc, uprc: roundToTwoDecimals(prc / buyQty) }),
      ...(image && { img: prefixLink(image, source.d) }),
      ...(sku && { sku }),
      ...(mku && { mku }),
    };

    const result = await updateProductWithQuery(productId, {
      $set: productUpdate,
    });
    log(`Updated product info: ${collection}-${productId.toString()}`, result);
    return productUpdate;
  } else {
    log(`No product info: ${collection}-${productId.toString()}`);
    return null;
  }
}
