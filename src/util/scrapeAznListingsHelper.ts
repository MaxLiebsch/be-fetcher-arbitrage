import {
  AddProductInfoProps,
  calculateAznArbitrage,
  DbProductRecord,
  detectCurrency,
  QueryQueue,
  roundToTwoDecimals,
  safeParsePrice,
} from "@dipmaxtech/clr-pkg";
import { updateArbispotterProductQuery } from "../db/util/crudArbispotterProduct";
import { resetAznProductQuery } from "../db/util/aznQueries";
import { UTCDate } from "@date-fns/utc";
import { defaultAznDealTask } from "../constants";
import { NegDealsOnAznStats } from "../types/taskStats/NegDealsOnAzn";
import { DealsOnAznStats } from "../types/taskStats/DealsOnAznStats";

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
    lnk: productLink,
  } = product;
  const { timestamp, taskIdProp } = processProps;
  infos.total++;
  queue.total++;

  if (productInfo) {
    const infoMap = new Map();
    productInfo.forEach((info) => infoMap.set(info.key, info.value));
    const price = infoMap.get("a_prc");
    const image = infoMap.get("a_img");
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
        await updateArbispotterProductQuery(collection, productLink, {
          $set: productUpdate,
          $unset: {
            [taskIdProp]: "",
          },
        });
      } else {
        infos.missingProperties.aznCostNeg++;
        await updateArbispotterProductQuery(
          collection,
          productLink,
          resetAznProductQuery()
        );
      }
    } else {
      infos.missingProperties.price++;
      await updateArbispotterProductQuery(
        collection,
        productLink,
        resetAznProductQuery()
      );
    }
  } else {
    infos.missingProperties.infos++;
    await updateArbispotterProductQuery(
      collection,
      productLink,
      resetAznProductQuery()
    );
  }
}
export async function handleAznListingNotFound(
  collection: string,
  productLink: string
) {
  await updateArbispotterProductQuery(
    collection,
    productLink,
    resetAznProductQuery()
  );
}
