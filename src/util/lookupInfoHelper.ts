import {
  AddProductInfoProps,
  DbProductRecord,
  generateUpdate,
  ObjectId,
  replaceAllHiddenCharacters,
} from "@dipmaxtech/clr-pkg";
import { resetAznProductQuery } from "../db/util/aznQueries";
import { updateArbispotterProductQuery } from "../db/util/crudArbispotterProduct";
import { upsertAsin } from "../db/util/asinTable.js";
import { UTCDate } from "@date-fns/utc";
import { LookupInfoStats } from "../types/taskStats/LookupInfoStats.js";

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

      await updateArbispotterProductQuery(collection, productId, {
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
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "a_prc is 0") {
          infos.missingProperties.price++;
        }
        if (error.message === "costs.azn is 0") {
          infos.missingProperties.costs++;
        }
        await updateArbispotterProductQuery(
          collection,
          productId,
          resetAznProductQuery({
            info_prop: "missing",
          })
        );
      }
    }
  } else {
    infos.missingProperties.infos++;
    await updateArbispotterProductQuery(
      collection,
      productId,
      resetAznProductQuery({
        info_prop: "missing",
      })
    );
  }
}

export async function handleLookupInfoNotFound(
  collection: string,
  productId: ObjectId
) {
  await updateArbispotterProductQuery(
    collection,
    productId,
    resetAznProductQuery({
      info_prop: "missing",
    })
  );
}
