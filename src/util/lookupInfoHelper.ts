import {
  AddProductInfoProps,
  DbProductRecord,
  generateUpdate,
  ObjectId,
  resetAznProductQuery,
  replaceAllHiddenCharacters,
} from "@dipmaxtech/clr-pkg";
import { upsertAsin } from "../db/util/asinTable.js";
import { UTCDate } from "@date-fns/utc";
import { LookupInfoStats } from "../types/taskStats/LookupInfoStats.js";

import { updateArbispotterProductQuery } from "../db/util/crudArbispotterProduct.js";
import { log } from "./logger.js";

export async function handleLookupInfoProductInfo(
  collection: string,
  hasEan: boolean,
  { productInfo, url }: AddProductInfoProps,
  product: DbProductRecord,
  infos: LookupInfoStats
) {
  const {
    prc: buyPrice,
    a_qty: sellQty,
    qty: buyQty,
    ean,
    a_vrfd,
    _id: productId,
  } = product;
  if (productInfo) {
    try {
      const update = generateUpdate(
        productInfo,
        buyPrice,
        sellQty || 1,
        buyQty || 1
      );
      const { costs, a_nm, asin } = update;

      update["a_orgn"] = "a";
      update["a_pblsh"] = true;
      if (hasEan) {
        await upsertAsin(asin, [ean], costs);
      }

      if (!a_vrfd) {
        update["a_vrfd"] = {
          vrfd: false,
          vrfn_pending: true,
          flags: [],
          flag_cnt: 0,
        };
      }

      const result = await updateArbispotterProductQuery(
        productId,
        {
          $set: {
            ...update,
            ...(a_nm && typeof a_nm === "string"
              ? { a_nm: replaceAllHiddenCharacters(a_nm) }
              : {}),
            info_prop: "complete",
            aznUpdatedAt: new UTCDate().toISOString(),
            infoUpdatedAt: new UTCDate().toISOString(),
          },
          $unset: { info_taskId: "" },
        }
      );
      log(`Updated infos: ${collection}-${productId.toString()}`, result);
    } catch (error) {
      if (error instanceof Error) {
        let loggerMessage = "";
        if (error.message === "a_prc is 0") {
          loggerMessage = `Price 0: ${collection}-${productId.toString()}`;
          infos.missingProperties.price++;
        }
        if (error.message === "costs.azn is 0") {
          loggerMessage = `Azn Costs 0: ${collection}-${productId.toString()}`;
          infos.missingProperties.costs++;
        }
        const result = await updateArbispotterProductQuery(
          productId,
          resetAznProductQuery({
            info_prop: "missing",
          })
        );
        log(loggerMessage, result);
      }
    }
  } else {
    infos.missingProperties.infos++;
    const result = await updateArbispotterProductQuery(
      productId,
      resetAznProductQuery({
        info_prop: "missing",
      })
    );
    log(`No infos: ${collection}-${productId.toString()}`, result);
  }
}

export async function handleLookupInfoNotFound(
  collection: string,
  productId: ObjectId
) {
  const result = await updateArbispotterProductQuery(
    productId,
    resetAznProductQuery({
      info_prop: "missing",
    })
  );
  log(`Not found: ${collection}-${productId.toString()}`, result);
}
