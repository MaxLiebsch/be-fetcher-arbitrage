import {
  calculateEbyArbitrage,
  findMappedCategory,
  roundToTwoDecimals,
  safeParsePrice,
} from "@dipmaxtech/clr-pkg";
import { updateArbispotterProductQuery } from "../services/db/util/crudArbispotterProduct.js";
import { resetEbyProductQuery } from "../services/db/util/ebyQueries.js";
import { UTCDate } from "@date-fns/utc";

export async function handleEbyListingProductInfo(
  collection,
  infos,
  { productInfo, url },
  queue,
  product
) {
  const {
    qty: buyQty,
    prc: buyPrice,
    ebyCategories,
    e_qty: sellQty,
    lnk: productLink,
  } = product;
  infos.total++;
  queue.total++;
  if (productInfo) {
    const infoMap = new Map();
    productInfo.forEach((info) => infoMap.set(info.key, info.value));
    const rawSellPrice = infoMap.get("e_prc");
    const image = infoMap.get("image");
    let productUpdate = {
      e_lnk: url.split("?")[0],
    };
    if (rawSellPrice) {
      const parsedSellPrice = safeParsePrice(rawSellPrice);
      productUpdate = {
        ...productUpdate,
        e_prc: parsedSellPrice,
        e_uprc: roundToTwoDecimals(parsedSellPrice / buyQty),
      };

      const mappedCategory = findMappedCategory(
        ebyCategories.reduce((acc, curr) => {
          acc.push(curr.id);
          return acc;
        }, [])
      );
      const { e_prc: sellPrice } = productUpdate;
      if (mappedCategory) {
        const arbitrage = calculateEbyArbitrage(
          mappedCategory,
          sellPrice, // e_prc, //VK
          buyPrice * (buyQty / sellQty) // prc * (e_qty / qty) //EK  //QTY Zielshop/QTY Herkunftsshop
        );
        if (arbitrage) {
          Object.entries(arbitrage).forEach(([key, val]) => {
            productUpdate[key] = val;
          });
          productUpdate = {
            ...productUpdate,
            ebyUpdatedAt: new UTCDate().toISOString(),
            ...(image && { e_img: image }),
          };

          await updateArbispotterProductQuery(collection, productLink, {
            $set: productUpdate,
            $unset: { eby_taskId: "" },
          });
        } else {
          infos.missingProperties.calculationFailed++;
          await updateArbispotterProductQuery(
            collection,
            productLink,
            resetEbyProductQuery()
          );
        }
      } else {
        infos.missingProperties.mappedCat++;
        await updateArbispotterProductQuery(
          collection,
          productLink,
          resetEbyProductQuery()
        );
      }
    } else {
      infos.missingProperties.price++;
      await updateArbispotterProductQuery(
        collection,
        productLink,
        resetEbyProductQuery()
      );
    }
  } else {
    await updateArbispotterProductQuery(
      collection,
      productLink,
      resetEbyProductQuery()
    );
    infos.notFound++;
  }
}

export async function handleEbyListingNotFound(
  collection,
  productLink,
  infos,
  queue
) {
  console.log("not found at all");
  infos.notFound++;
  infos.total++;
  queue.total++;
  await updateArbispotterProductQuery(
    collection,
    productLink,
    resetEbyProductQuery()
  );
}
