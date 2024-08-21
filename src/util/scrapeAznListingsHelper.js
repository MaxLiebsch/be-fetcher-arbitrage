import {
  calculateAznArbitrage,
  roundToTwoDecimals,
  safeParsePrice,
} from "@dipmaxtech/clr-pkg";
import { updateArbispotterProductQuery } from "../services/db/util/crudArbispotterProduct.js";
import { resetAznProductQuery } from "../services/db/util/aznQueries.js";
import { UTCDate } from "@date-fns/utc";

export async function handleAznListingProductInfo(
  collection,
  product,
  { productInfo, url },
  infos,
  queue
) {
  const {
    costs,
    a_qty: sellQty,
    qty: buyQty,
    prc: buyPrice,
    tax,
    lnk: productLink,
  } = product;
  infos.total++;
  queue.total++;
  if (productInfo) {
    const infoMap = new Map();
    productInfo.forEach((info) => infoMap.set(info.key, info.value));
    const price = infoMap.get("a_prc");
    const image = infoMap.get("a_img");
    const bsr = infoMap.get("bsr");
    if (price > 0) {
      if (costs.azn > 0) {
        const productUpdate = {
          aznUpdatedAt: new UTCDate().toISOString(),
          ...(image && { a_img: image }),
          ...(bsr && { bsr }),
        };
        const parsedPrice = safeParsePrice(price);
        const a_prc = parsedPrice;
        const a_uprc = roundToTwoDecimals(parsedPrice / sellQty);
        Object.assign(productUpdate, { a_prc, a_uprc });
        const { a_prc: sellPrice } = productUpdate;

        const arbitrage = calculateAznArbitrage(
          buyPrice * (sellQty / buyQty),
          sellPrice,
          costs,
          tax
        );
        Object.entries(arbitrage).forEach(([key, val]) => {
          productUpdate[key] = val;
        });
        await updateArbispotterProductQuery(collection, productLink, {
          $set: productUpdate,
          $unset: {
            azn_taskId: "",
          },
        });
      } else {
        infos.missingProperties.aznCostNeg++;
        await updateArbispotterProductQuery(
          collection,
          productLink,
          resetAznProductQuery({info_prop: ""})
        );
      }
    } else {
      infos.missingProperties.price++;
      await updateArbispotterProductQuery(
        collection,
        productLink,
        resetAznProductQuery({info_prop: ""})
      );
    }
  } else {
    infos.missingProperties.infos++;
    await updateArbispotterProductQuery(
      collection,
      productLink,
      resetAznProductQuery({info_prop: ""})
    );
  }
}
export async function handleAznListingNotFound(
  collection,
  productLink,
  infos,
  queue
) {
  infos.notFound++;
  infos.total++;
  queue.total++;
  await updateArbispotterProductQuery(
    collection,
    productLink,
    resetAznProductQuery({info_prop: ""})
  );
}
