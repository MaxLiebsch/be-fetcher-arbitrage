import {
  deliveryTime,
  detectCurrency,
  roundToTwoDecimals,
  safeParsePrice,
} from "@dipmaxtech/clr-pkg";
import { UTCDate } from "@date-fns/utc";
import { updateArbispotterProductQuery } from "../../services/db/util/crudArbispotterProduct.js";

export async function handleDealsProductInfo(
  collectionName,
  { productInfo, url },
  product
) {
  const { lnk: productLink, qty: buyQty } = product;
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

    await updateArbispotterProductQuery(collectionName, productLink, {
      $set: productUpdate,
      $unset: { eby_taskId: "" },
    });
    return productUpdate;
  } else {
    return null;
  }
}
