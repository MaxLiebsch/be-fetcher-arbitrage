import {
  AddProductInfoProps,
  calculateAznArbitrage,
  DbProductRecord,
  detectCurrency,
  ObjectId,
  QueryQueue,
  roundToTwoDecimals,
  safeParsePrice,
  resetAznProductQuery,
  replaceAllHiddenCharacters,
} from "@dipmaxtech/clr-pkg";
import { UTCDate } from "@date-fns/utc";
import { updateProductWithQuery } from "../db/util/crudProducts.js";
import { defaultAznDealTask } from "../constants.js";
import { NegDealsOnAznStats } from "../types/taskStats/NegDealsOnAzn.js";
import { DealsOnAznStats } from "../types/taskStats/DealsOnAznStats.js";
import { log } from "./logger.js";

export async function handleAznListingProductInfo(
  collection: string,
  product: DbProductRecord,
  { productInfo, url }: AddProductInfoProps,
  infos: NegDealsOnAznStats | DealsOnAznStats,
  queue: QueryQueue,
  processProps = defaultAznDealTask
) {
  const {
    costs,
    a_qty: sellQty,
    qty: buyQty,
    prc: buyPrice,
    tax,
    _id: productId,
  } = product;
  const { timestamp, taskIdProp } = processProps;
  infos.total++;
  queue.total++;

  if (productInfo) {
    const infoMap = new Map();
    productInfo.forEach((info) => infoMap.set(info.key, info.value));
    const price = infoMap.get("a_prc");
    const image = infoMap.get("a_img");
    const rawName = infoMap.get("name");
    const bsr = infoMap.get("bsr");
    const parsedPrice = safeParsePrice(price || "0");

    if (parsedPrice > 0) {
      if (costs && costs.azn > 0) {
        const currency = detectCurrency(price);
        const a_prc = parsedPrice;
        const a_uprc = roundToTwoDecimals(parsedPrice / sellQty!);

        const productUpdate = {
          [timestamp]: new UTCDate().toISOString(),
          a_prc,
          a_uprc,
          ...(rawName && { a_nm: replaceAllHiddenCharacters(rawName) }),
          ...(currency && { a_cur: currency }),
          ...(image && { a_img: image }),
          ...(bsr && { bsr }),
        };

        const arbitrage = calculateAznArbitrage(
          buyPrice * (sellQty! / buyQty),
          a_prc,
          costs,
          tax
        );
        Object.entries(arbitrage).forEach(([key, val]) => {
          productUpdate[key] = val;
        });
        const result = await updateProductWithQuery(productId, {
          $set: productUpdate,
          $unset: {
            [taskIdProp]: "",
          },
        });
        log(`Product info: ${collection}-${productId}`, result);
      } else {
        infos.missingProperties.aznCostNeg++;
        const result = await updateProductWithQuery(
          productId,
          resetAznProductQuery()
        );
        log(`Costs 0: ${collection}-${productId}`, result);
      }
    } else {
      infos.missingProperties.price++;
      const result = await updateProductWithQuery(
        productId,
        resetAznProductQuery()
      );
      log(`Price 0: ${collection}-${productId}`, result);
    }
  } else {
    infos.missingProperties.infos++;
    const result = await updateProductWithQuery(
      productId,
      resetAznProductQuery()
    );
    log(`No product info: ${collection}-${productId}`, result);
  }
}
export async function handleAznListingNotFound(
  collection: string,
  id: ObjectId
) {
  const result = await updateProductWithQuery(
    id,
    resetAznProductQuery()
  );
  log(`Not found: ${collection}-${id}`, result);
}
