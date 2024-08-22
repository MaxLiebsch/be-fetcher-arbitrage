import {
  generateUpdate,
  replaceAllHiddenCharacters,
} from "@dipmaxtech/clr-pkg";
import { resetAznProductQuery } from "../services/db/util/aznQueries.js";
import { updateArbispotterProductQuery } from "../services/db/util/crudArbispotterProduct.js";
import { upsertAsin } from "../services/db/util/asinTable.js";
import { UTCDate } from "@date-fns/utc";

export async function handleLookupInfoProductInfo(
  collection,
  hasEan,
  { productInfo, url },
  product,
  infos
) {
  const {
    prc: buyPrice,
    q_qty: sellQty,
    qty: buyQty,
    ean,
    a_vrfd,
    lnk: productLink,
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
        update["eanList"] = [ean];
      }

      if (!a_vrfd) {
        update["a_vrfd"] = {
          vrfd: false,
          vrfn_pending: true,
          flags: [],
          flag_cnt: 0,
        };
      }

      await updateArbispotterProductQuery(collection, productLink, {
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
          productLink,
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
      productLink,
      resetAznProductQuery({
        info_prop: "missing",
      })
    );
  }
}

export async function handleLookupInfoNotFound(collection, productLink) {
  const query = resetAznProductQuery({
    info_prop: "missing",
  });
  await updateArbispotterProductQuery(collection, productLink, query);
}
