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
} from "@dipmaxtech/clr-pkg";
import { updateArbispotterProductQuery } from "../db/util/crudArbispotterProduct";
import { resetEbyProductQuery } from "../db/util/ebyQueries";
import { UTCDate } from "@date-fns/utc";
import { defaultEbyDealTask } from "../constants";
import { DealsOnEbyStats } from "../types/taskStats/DealsOnEbyStats";

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
  } = product;
  const { timestamp, taskIdProp } = processProps;
  infos.total++;
  queue.total++;
  if (productInfo) {
    const infoMap = new Map();
    productInfo.forEach((info) => infoMap.set(info.key, info.value));
    const rawSellPrice = infoMap.get("e_prc");
    const image = infoMap.get("image");
    const instock = infoMap.get("instock");

    if (
      instock &&
      expiredIndicatorStrs.some((str) =>
        instock.toLowerCase().includes(str.toLowerCase())
      )
    ) {
      await updateArbispotterProductQuery(
        collection,
        productId,
        resetEbyProductQuery()
      );
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
          e_prc: parsedSellPrice,
          e_uprc: roundToTwoDecimals(parsedSellPrice / buyQty),
        };

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

            await updateArbispotterProductQuery(collection, productId, query);
          } else {
            infos.missingProperties.calculationFailed++;
            await updateArbispotterProductQuery(
              collection,
              productId,
              resetEbyProductQuery()
            );
          }
        } else {
          infos.missingProperties.mappedCat++;
          await updateArbispotterProductQuery(
            collection,
            productId,
            resetEbyProductQuery()
          );
        }
      } else {
        infos.missingProperties.price++;
        await updateArbispotterProductQuery(
          collection,
          productId,
          resetEbyProductQuery()
        );
      }
    }
  } else {
    await updateArbispotterProductQuery(collection, productId, resetEbyProductQuery());
    infos.notFound++;
  }
}

export async function handleEbyListingNotFound(
  collection: string,
  id: ObjectId
) {
  await updateArbispotterProductQuery(collection, id, resetEbyProductQuery());
}
