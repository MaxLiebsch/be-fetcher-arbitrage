import {
  AddProductInfoProps,
  calculateEbyArbitrage,
  DbProductRecord,
  detectCurrency,
  findMappedCategory,
  ObjectId,
  QueryQueue,
  roundToTwoDecimals,
  safeParsePrice,
  resetEbyProductQuery,
  replaceAllHiddenCharacters,
} from "@dipmaxtech/clr-pkg";
import { UTCDate } from "@date-fns/utc";
import { updateArbispotterProductQuery } from "../db/util/crudArbispotterProduct.js";
import { defaultEbyDealTask } from "../constants.js";
import { DealsOnEbyStats } from "../types/taskStats/DealsOnEbyStats.js";
import { log } from "./logger.js";

export const expiredIndicatorStrs = [
  "beendet",
  "nicht mehr verfügbar",
  "Dieses Angebot wurde vom Verkäufer",
  "nicht vorrätig",
  "out of stock",
  "This listing was ended by the seller",
  "no longer available",
];

export async function handleEbyListingProductInfo(
  collection: string,
  infos: DealsOnEbyStats,
  { productInfo, url }: AddProductInfoProps,
  product: DbProductRecord,
  queue: QueryQueue,
  processProps = defaultEbyDealTask
) {
  const {
    qty: buyQty,
    prc: buyPrice,
    ebyCategories,
    e_qty: sellQty,
    _id: productId,
    e_pRange: sellPriceRange,
  } = product;
  const { timestamp, taskIdProp } = processProps;
  infos.total++;
  queue.total++;
  if (productInfo) {
    const infoMap = new Map();
    productInfo.forEach((info) => infoMap.set(info.key, info.value));
    const rawSellPrice = infoMap.get("e_prc");
    const rawName = infoMap.get("name");
    const image = infoMap.get("image");
    const instock = infoMap.get("instock");

    if (
      instock &&
      expiredIndicatorStrs.some((str) =>
        instock.toLowerCase().includes(str.toLowerCase())
      )
    ) {
      const result = await updateArbispotterProductQuery(
        collection,
        productId,
        resetEbyProductQuery()
      );
      log(`Product expired: ${collection}-${productId}`, result);
    } else {
      let productUpdate: Partial<DbProductRecord> = {
        e_lnk: url.split("?")[0],
      };
      if (rawSellPrice) {
        const parsedSellPrice = safeParsePrice(rawSellPrice);
        const currency = detectCurrency(rawSellPrice);

        productUpdate = {
          ...productUpdate,
          ...(currency && { e_cur: currency }),
          ...(rawName && { e_nm: replaceAllHiddenCharacters(rawName) }),
          e_prc: parsedSellPrice,
          e_uprc: roundToTwoDecimals(parsedSellPrice / buyQty),
        };

        if (sellPriceRange && parsedSellPrice >= sellPriceRange?.max) {
          productUpdate["e_pRange"] = {
            ...sellPriceRange,
            max: parsedSellPrice,
          };
        }
        if (sellPriceRange && parsedSellPrice <= sellPriceRange?.min) {
          productUpdate["e_pRange"] = {
            ...sellPriceRange,
            min: parsedSellPrice,
          };
        }

        const mappedCategory = findMappedCategory(
          ebyCategories!.reduce<number[]>((acc, curr) => {
            acc.push(curr.id);
            return acc;
          }, [])
        );
        const { e_prc: sellPrice } = productUpdate;
        if (mappedCategory) {
          const arbitrage = calculateEbyArbitrage(
            mappedCategory,
            sellPrice!, // e_prc, //VK
            buyPrice * (buyQty / sellQty!) // prc * (e_qty / qty) //EK  //QTY Zielshop/QTY Herkunftsshop
          );
          if (arbitrage) {
            Object.entries(arbitrage).forEach(([key, val]) => {
              (productUpdate as any)[key] = val;
            });
            productUpdate = {
              ...productUpdate,
              [timestamp]: new UTCDate().toISOString(),
              ...(image && { e_img: image }),
            };
            const query = {
              $set: productUpdate,
              $unset: { [taskIdProp]: "" },
            };

            const result = await updateArbispotterProductQuery(
              collection,
              productId,
              query
            );
            log(`Product updated: ${collection}-${productId}`, result);
          } else {
            infos.missingProperties.calculationFailed++;
            const result = await updateArbispotterProductQuery(
              collection,
              productId,
              resetEbyProductQuery()
            );
            log(`Calculation failed: ${collection}-${productId}`, result);
          }
        } else {
          infos.missingProperties.mappedCat++;
          const result = await updateArbispotterProductQuery(
            collection,
            productId,
            resetEbyProductQuery()
          );
          log(`Mapped category not found: ${collection}-${productId}`, result);
        }
      } else {
        infos.missingProperties.price++;
        const result = await updateArbispotterProductQuery(
          collection,
          productId,
          resetEbyProductQuery()
        );
        log(`Price not found: ${collection}-${productId}`, result);
      }
    }
  } else {
    const result = await updateArbispotterProductQuery(
      collection,
      productId,
      resetEbyProductQuery()
    );
    log(`Product info not found: ${collection}-${productId}`, result);
    infos.notFound++;
  }
}

export async function handleEbyListingNotFound(
  collection: string,
  id: ObjectId
) {
  const result = await updateArbispotterProductQuery(
    collection,
    id,
    resetEbyProductQuery()
  );
  log(`Not found: ${collection}-${id}`, result);
}
