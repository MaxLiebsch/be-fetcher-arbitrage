import {
  AddProductInfoProps,
  DbProductRecord,
  deliveryTime,
  detectCurrency,
  roundToTwoDecimals,
  safeParsePrice,
} from "@dipmaxtech/clr-pkg";
import { UTCDate } from "@date-fns/utc";
import { updateArbispotterProductQuery } from "../../db/util/crudArbispotterProduct.js";
import { log } from "../logger.js";

export async function handleDealsProductInfo(
  collection: string,
  { productInfo, url }: AddProductInfoProps,
  product: DbProductRecord
) {
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
      availUpdatedAt: new UTCDate().toISOString(),
      ...(parsedDeliveryTime && { a: parsedDeliveryTime }),
      ...(currency && { cur: currency }),
      ...(prc && { prc, uprc: roundToTwoDecimals(prc / buyQty) }),
      ...(image && { img: image }),
      ...(sku && { sku }),
      ...(mku && { mku }),
    };

    const result = await updateArbispotterProductQuery(collection, productId, {
      $set: productUpdate,
    });
    log(`Updated product info: ${collection}-${productId.toString()}`, result);
    return productUpdate;
  } else {
    log(`No product info: ${collection}-${productId.toString()}`);
    return null;
  }
}
